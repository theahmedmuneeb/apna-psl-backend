import { db } from '@/db'
import { tickets, seats, enclosures, profiles, matches, pendingTickets } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { ethers } from 'ethers'
import { env } from '@/env'
import { releaseSeatLock, getLockByHashes, SigningError } from './ticket-signing.service'

// ── Minimal ABI for parsing TicketMinted events ──
const TICKET_MINTED_ABI = [
    'event TicketMinted(address indexed buyer, uint256 indexed tokenId, bytes32 matchId, bytes32 seatId)',
]

// ── Reverse lookup: bytes32 → UUID by scanning the table ──
const findMatchByBytes32 = async (matchIdBytes: string) => {
    const allMatches = await db.select({ id: matches.id }).from(matches).execute()
    for (const m of allMatches) {
        const hash = ethers.keccak256(ethers.toUtf8Bytes(m.id))
        if (hash === matchIdBytes) return m.id
    }
    return null
}

const findSeatByBytes32 = async (seatIdBytes: string) => {
    const allSeats = await db.select({ id: seats.id }).from(seats).execute()
    for (const s of allSeats) {
        const hash = ethers.keccak256(ethers.toUtf8Bytes(s.id))
        if (hash === seatIdBytes) return s.id
    }
    return null
}

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

// ── Main confirm function ──
export const confirmBooking = async (txHash: string) => {
    // 1. Connect to RPC and fetch receipt
    const provider = new ethers.JsonRpcProvider(env.NEXT_PUBLIC_WALLET_BRIDGE_RPC_URL)
    const receipt = await provider.getTransactionReceipt(txHash)

    if (!receipt) {
        console.error(`[confirmBooking] Transaction receipt not found for hash: ${txHash}`)
        throw new SigningError('Transaction not found', 404, 'TX_NOT_FOUND')
    }

    if (receipt.status !== 1) {
        console.error(`[confirmBooking] Transaction failed on-chain. Status: ${receipt.status}, Hash: ${txHash}`)
        throw new SigningError('Transaction failed on-chain', 400, 'TX_FAILED')
    }

    console.log(`[confirmBooking] Transaction found and successful. Gas used: ${receipt.gasUsed?.toString()}`)

    // 2. Parse TicketMinted event from logs
    const iface = new ethers.Interface(TICKET_MINTED_ABI)
    let mintedEvent: ethers.LogDescription | null = null

    for (const log of receipt.logs) {
        // Optional: Ensure the log comes from our contract
        if (log.address.toLowerCase() !== env.TICKET_CONTRACT_ADDRESS.toLowerCase()) {
            continue
        }

        try {
            const parsed = iface.parseLog({ topics: log.topics as string[], data: log.data })
            if (parsed && parsed.name === 'TicketMinted') {
                mintedEvent = parsed
                break
            }
        } catch (e) {
            console.debug(`[confirmBooking] Failed to parse log at address ${log.address}:`, e)
        }
    }

    if (!mintedEvent) {
        console.error(`[confirmBooking] TicketMinted event not found in receipt for hash: ${txHash}`)
        console.log(`[confirmBooking] Receipt logs count: ${receipt.logs.length}`)
        receipt.logs.forEach((l, i) => {
            console.log(`[confirmBooking] Log ${i} address: ${l.address}, topics: ${JSON.stringify(l.topics)}`)
        })
        throw new SigningError('TicketMinted event not found in transaction', 400, 'EVENT_NOT_FOUND')
    }

    // 3. Extract event data
    const tokenId = mintedEvent.args.tokenId.toString()
    const buyerAddress = mintedEvent.args.buyer as string
    const buyerWalletAddress = buyerAddress.toLowerCase()
    const matchIdBytes = mintedEvent.args.matchId as string
    const seatIdBytes = mintedEvent.args.seatId as string

    // 4. Reverse lookup UUIDs from bytes32
    let matchId: string | null = null
    let seatId: string | null = null
    let ownerId: string | null = null

    // Attempt fast lookup via in-memory locks first
    const lock = getLockByHashes(matchIdBytes, seatIdBytes)
    if (lock) {
        console.log(`[confirmBooking] Fast lookup succeeded for seat ${lock.seatId}`)
        matchId = lock.matchId
        seatId = lock.seatId
        ownerId = lock.userId
    } else {
        console.log(`[confirmBooking] Fast lookup failed, trying persistent DB lookup...`)
        const [pending] = await db
            .select()
            .from(pendingTickets)
            .where(
                and(
                    eq(pendingTickets.matchIdBytes, matchIdBytes),
                    eq(pendingTickets.seatIdBytes, seatIdBytes),
                ),
            )
            .limit(1)
            .execute()

        if (pending) {
            console.log(`[confirmBooking] Persistent lookup succeeded for seat ${pending.seatId}`)
            matchId = pending.matchId
            seatId = pending.seatId
            ownerId = pending.userId
        } else {
            console.log(`[confirmBooking] Persistent lookup failed, falling back to database scan (slow)`)
            matchId = await findMatchByBytes32(matchIdBytes)
            seatId = await findSeatByBytes32(seatIdBytes)
        }
    }

    if (!matchId) {
        console.error(`[confirmBooking] Match not found for matchIdBytes: ${matchIdBytes}`)
        throw new SigningError('Match not found for on-chain matchId', 404, 'MATCH_NOT_FOUND')
    }

    if (!seatId) {
        console.error(`[confirmBooking] Seat not found for seatIdBytes: ${seatIdBytes}`)
        throw new SigningError('Seat not found for on-chain seatId', 404, 'SEAT_NOT_FOUND')
    }

    // 5. Check for duplicate booking
    const [existingTicket] = await db
        .select({ id: tickets.id })
        .from(tickets)
        .where(and(eq(tickets.seatId, seatId), eq(tickets.matchId, matchId)))
        .limit(1)
        .execute()

    if (existingTicket) {
        throw new SigningError('Seat is already booked for this match', 409, 'ALREADY_BOOKED')
    }

    // 6. Check for duplicate txHash (same NFT token already stored)
    const [existingNft] = await db
        .select({ id: tickets.id })
        .from(tickets)
        .where(
            and(
                eq(tickets.nftContractAddress, env.TICKET_CONTRACT_ADDRESS),
                eq(tickets.nftTokenId, tokenId),
            ),
        )
        .limit(1)
        .execute()

    if (existingNft) {
        throw new SigningError('This NFT has already been recorded', 409, 'DUPLICATE_NFT')
    }

    // 7. Resolve app-level owner mapping by wallet when available.
    if (!ownerId) {
        ownerId = await resolveOwnerIdByWallet(buyerWalletAddress)
    }

    const result = await insertTicket(ownerId, buyerWalletAddress, matchId, seatId, tokenId, txHash)

    // 8. Persistent Cleanup
    try {
        await db.delete(pendingTickets)
            .where(
                and(
                    eq(pendingTickets.matchIdBytes, matchIdBytes),
                    eq(pendingTickets.seatIdBytes, seatIdBytes),
                ),
            )
            .execute()
        console.log(`[confirmBooking] Persistent pending record cleaned for seat ${seatId}`)
    } catch (e) {
        console.warn(`[confirmBooking] Failed to clean pending record:`, e)
    }

    return result
}

async function insertTicket(
    ownerId: string | null,
    walletAddress: string,
    matchId: string,
    seatId: string,
    tokenId: string,
    txHash: string,
) {
    // Look up enclosure category from seat
    const [seat] = await db
        .select({ enclosureId: seats.enclosureId })
        .from(seats)
        .where(eq(seats.id, seatId))
        .limit(1)
        .execute()

    const [enclosure] = await db
        .select({ enclosureCategoryId: enclosures.enclosureCategoryId })
        .from(enclosures)
        .where(eq(enclosures.id, seat!.enclosureId))
        .limit(1)
        .execute()

    // Insert ticket
    const [ticket] = await db
        .insert(tickets)
        .values({
            ownerId,
            walletAddress,
            matchId,
            seatId,
            enclosureCategoryId: enclosure!.enclosureCategoryId,
            nftContractAddress: env.TICKET_CONTRACT_ADDRESS,
            nftTokenId: tokenId,
            nftMetadata: {
                txHash,
                tokenId,
                contractAddress: env.TICKET_CONTRACT_ADDRESS,
                chainId: env.NEXT_PUBLIC_WALLET_BRIDGE_CHAIN_ID_DECIMAL,
            },
            status: 'valid',
        })
        .returning()
        .execute()

    // Release the seat lock
    releaseSeatLock(seatId, matchId)

    return ticket
}
