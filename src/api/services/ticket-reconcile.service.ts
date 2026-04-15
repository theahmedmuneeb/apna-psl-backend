import { db } from '@/db'
import { pendingTickets, tickets, profiles, syncState } from '@/db/schema'
import { eq, and, gt } from 'drizzle-orm'
import { ethers } from 'ethers'
import { env } from '@/env'
import { confirmBooking } from './ticket-confirm.service'

const TICKET_MINTED_ABI = [
    'event TicketMinted(address indexed buyer, uint256 indexed tokenId, bytes32 matchId, bytes32 seatId)',
]

const TRANSFER_ABI = [
    'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
]

const TICKET_TRANSFER_SYNC_KEY = 'ticket_transfer_sync'
const MAX_TRANSFER_LOG_BLOCK_RANGE = 9_999

const resolveOwnerIdByWallet = async (walletAddress: string) => {
    const normalizedWallet = walletAddress.toLowerCase()
    const [profile] = await db
        .select({ id: profiles.id })
        .from(profiles)
        .where(eq(profiles.walletAddress, normalizedWallet))
        .limit(1)
        .execute()

    if (profile) {
        return profile.id
    }

    const allProfiles = await db
        .select({ id: profiles.id, walletAddress: profiles.walletAddress })
        .from(profiles)
        .execute()

    const matched = allProfiles.find((p) => p.walletAddress?.toLowerCase() === normalizedWallet)
    return matched?.id ?? null
}

export const syncTicketTransfersFromChain = async () => {
    console.log('[transfer-sync] Starting ticket Transfer-event sync...')
    const provider = new ethers.JsonRpcProvider(env.NEXT_PUBLIC_WALLET_BRIDGE_RPC_URL)
    const iface = new ethers.Interface(TRANSFER_ABI)
    const latestBlock = await provider.getBlockNumber()

    const [stateRow] = await db
        .select({
            key: syncState.key,
            lastSyncedBlock: syncState.lastSyncedBlock,
        })
        .from(syncState)
        .where(eq(syncState.key, TICKET_TRANSFER_SYNC_KEY))
        .limit(1)
        .execute()

    const lastSyncedBlock = stateRow?.lastSyncedBlock ?? 0
    const fromBlock = Math.max(0, lastSyncedBlock > 0 ? lastSyncedBlock + 1 : 0)

    if (!stateRow) {
        await db
            .insert(syncState)
            .values({
                key: TICKET_TRANSFER_SYNC_KEY,
                lastSyncedBlock: fromBlock,
            })
            .onConflictDoNothing()
            .execute()
    }

    if (fromBlock > latestBlock) {
        return {
            fromBlock,
            toBlock: latestBlock,
            events: 0,
            updatedTickets: 0,
        }
    }

    let totalEvents = 0
    let updatedTickets = 0

    for (
        let chunkStart = fromBlock;
        chunkStart <= latestBlock;
        chunkStart += MAX_TRANSFER_LOG_BLOCK_RANGE + 1
    ) {
        const chunkEnd = Math.min(chunkStart + MAX_TRANSFER_LOG_BLOCK_RANGE, latestBlock)
        const logs = await provider.getLogs({
            address: env.TICKET_CONTRACT_ADDRESS,
            fromBlock: chunkStart,
            toBlock: chunkEnd,
            topics: [ethers.id('Transfer(address,address,uint256)')],
        })

        totalEvents += logs.length

        for (const log of logs) {
            try {
                const parsed = iface.parseLog({ topics: log.topics as string[], data: log.data })
                if (!parsed) continue

                const tokenId = parsed.args.tokenId.toString()
                const newOwnerWallet = (parsed.args.to as string).toLowerCase()
                const ownerId = await resolveOwnerIdByWallet(newOwnerWallet)

                const updated = await db
                    .update(tickets)
                    .set({
                        walletAddress: newOwnerWallet,
                        ownerId,
                        updatedAt: new Date(),
                    })
                    .where(
                        and(
                            eq(tickets.nftContractAddress, env.TICKET_CONTRACT_ADDRESS),
                            eq(tickets.nftTokenId, tokenId),
                        ),
                    )
                    .returning({ id: tickets.id })
                    .execute()

                if (updated.length > 0) {
                    updatedTickets += updated.length
                }
            } catch (e) {
                console.error('[transfer-sync] Error processing Transfer log:', e)
            }
        }
    }

    await db
        .update(syncState)
        .set({
            lastSyncedBlock: latestBlock,
            updatedAt: new Date(),
        })
        .where(eq(syncState.key, TICKET_TRANSFER_SYNC_KEY))
        .execute()

    console.log(
        `[transfer-sync] Completed. from=${fromBlock}, to=${latestBlock}, events=${totalEvents}, updated=${updatedTickets}`,
    )

    return {
        fromBlock,
        toBlock: latestBlock,
        events: totalEvents,
        updatedTickets,
    }
}

export const reconcilePendingTickets = async () => {
    console.log('[reconcile] Starting ticket reconciliation...')
    const provider = new ethers.JsonRpcProvider(env.NEXT_PUBLIC_WALLET_BRIDGE_RPC_URL)
    const iface = new ethers.Interface(TICKET_MINTED_ABI)

    // 1. Fetch pending tickets that haven't expired too long ago
    // (We scan those created in the last 24 hours just in case)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const pendingList = await db
        .select()
        .from(pendingTickets)
        .where(gt(pendingTickets.createdAt, oneDayAgo))
        .execute()

    if (pendingList.length === 0) {
        console.log('[reconcile] No pending tickets to reconcile.')
        return { reconciled: 0, checked: 0 }
    }

    console.log(`[reconcile] Found ${pendingList.length} pending requests. Scanning blockchain...`)

    // 2. Scan for TicketMinted events in the last ~500 blocks
    const currentBlock = await provider.getBlockNumber()
    const fromBlock = Math.max(0, currentBlock - 500)
    
    const logs = await provider.getLogs({
        address: env.TICKET_CONTRACT_ADDRESS,
        fromBlock,
        toBlock: currentBlock,
        topics: [ethers.id('TicketMinted(address,uint256,bytes32,bytes32)')]
    })

    console.log(`[reconcile] Found ${logs.length} TicketMinted events in last 500 blocks.`)

    let reconciledCount = 0

    // 3. Match logs to pending entries
    for (const log of logs) {
        try {
            const parsed = iface.parseLog({ topics: log.topics as string[], data: log.data })
            if (!parsed) continue

            const matchIdBytes = parsed.args.matchId as string
            const seatIdBytes = parsed.args.seatId as string
            const txHash = log.transactionHash

            // Find if this log matches any of our pending tickets
            const match = pendingList.find(
                p => p.matchIdBytes === matchIdBytes && p.seatIdBytes === seatIdBytes
            )

            if (match) {
                console.log(`[reconcile] Found on-chain match for pending seat ${match.seatId}. Confirming...`)
                try {
                    await confirmBooking(txHash)
                    reconciledCount++
                    console.log(`[reconcile] Successfully reconciled ticket for seat ${match.seatId}`)
                } catch (err) {
                    // It might already be confirmed by a race condition
                    const errMsg = err instanceof Error ? err.message : String(err)
                    if (errMsg.includes('recorded') || errMsg.includes('booked')) {
                         console.log(`[reconcile] Ticket already processed for seat ${match.seatId}`)
                         // Cleanup pending record if it's already in the main tickets table
                         await db.delete(pendingTickets).where(eq(pendingTickets.id, match.id)).execute()
                    } else {
                        console.error(`[reconcile] Failed to confirm matched ticket:`, err)
                    }
                }
            }
        } catch (e) {
            console.error('[reconcile] Error processing log:', e)
        }
    }

    console.log(`[reconcile] Reconciliation finished. Reconciled ${reconciledCount} tickets.`)
    return { reconciled: reconciledCount, checked: pendingList.length }
}
