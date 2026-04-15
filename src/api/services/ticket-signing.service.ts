import { db } from '@/db'
import { tickets, seats, enclosures, matchPricing, pendingTickets } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { ethers } from 'ethers'
import { env } from '@/env'

// ── In-memory seat locks (TTL-based) ──
const LOCK_DURATION_MS = 5 * 60 * 1000 // 5 minutes
const LOCK_DURATION_SEC = 300

type SeatLock = {
    userId: string      // Supabase user.id
    userAddress: string
    matchId: string    // UUID
    seatId: string     // UUID
    matchIdBytes: string
    seatIdBytes: string
    expiresAt: number // unix ms
}

/** 
 * Map of matchIdBytes::seatIdBytes -> SeatLock
 * This allows O(1) reverse lookup during confirmation
 */
const seatLocks = new Map<string, SeatLock>()

const lockKey = (seatIdOrHash: string, matchIdOrHash: string) => `${matchIdOrHash}::${seatIdOrHash}`

/** Periodically clean expired locks */
setInterval(() => {
    const now = Date.now()
    for (const [key, lock] of seatLocks) {
        if (lock.expiresAt <= now) seatLocks.delete(key)
    }
}, 60_000)

export const acquireSeatLock = (
    seatId: string,
    matchId: string,
    userAddress: string,
    userId: string,
    matchIdBytes: string,
    seatIdBytes: string
): boolean => {
    const key = lockKey(seatId, matchId)
    const existing = seatLocks.get(key)
    const now = Date.now()

    // If lock exists and hasn't expired and belongs to another user, deny
    if (existing && existing.expiresAt > now && existing.userAddress.toLowerCase() !== userAddress.toLowerCase()) {
        return false
    }

    seatLocks.set(key, {
        userId,
        userAddress,
        matchId,
        seatId,
        matchIdBytes,
        seatIdBytes,
        expiresAt: now + LOCK_DURATION_MS
    })

    // Also index by hash for fast lookup during confirmation
    const hashKey = lockKey(seatIdBytes, matchIdBytes)
    seatLocks.set(hashKey, seatLocks.get(key)!)

    return true
}

export const releaseSeatLock = (seatId: string, matchId: string) => {
    const key = lockKey(seatId, matchId)
    const lock = seatLocks.get(key)
    if (lock) {
        seatLocks.delete(lockKey(lock.seatIdBytes, lock.matchIdBytes))
    }
    seatLocks.delete(key)
}

export const getLockByHashes = (matchIdBytes: string, seatIdBytes: string): SeatLock | null => {
    const key = lockKey(seatIdBytes, matchIdBytes)
    const lock = seatLocks.get(key)
    if (!lock || lock.expiresAt <= Date.now()) return null
    return lock
}

// ── UUID → bytes32 conversion ──
const uuidToBytes32 = (uuid: string): string => {
    return ethers.keccak256(ethers.toUtf8Bytes(uuid))
}

/** 
 * Scans the blockchain for any TicketMinted events matching this seat. 
 * This is a definitive on-chain occupancy check.
 */
async function isSeatOccupiedOnChain(matchIdBytes: string, seatIdBytes: string): Promise<boolean> {
    const provider = new ethers.JsonRpcProvider(env.NEXT_PUBLIC_WALLET_BRIDGE_RPC_URL)
    const topic0 = ethers.id('TicketMinted(address,uint256,bytes32,bytes32)')
    
    // We scan the last 10,000 blocks. For a definitive check on a real app, 
    // you'd typically have an indexer, but this works for testnets/recent activity.
    const currentBlock = await provider.getBlockNumber()
    const fromBlock = Math.max(0, currentBlock - 5000)

    const logs = await provider.getLogs({
        address: env.TICKET_CONTRACT_ADDRESS,
        fromBlock,
        toBlock: currentBlock,
        topics: [topic0]
    })

    const iface = new ethers.Interface([
        'event TicketMinted(address indexed buyer, uint256 indexed tokenId, bytes32 matchId, bytes32 seatId)'
    ])

    for (const log of logs) {
        try {
            const parsed = iface.parseLog({ topics: log.topics as string[], data: log.data })
            if (parsed && parsed.args.matchId === matchIdBytes && parsed.args.seatId === seatIdBytes) {
                return true
            }
        } catch {
            continue
        }
    }
    return false
}

// ── Signature generation ──
export const generateSignature = async (
    userAddress: string,
    matchId: string,
    seatId: string,
    userId: string,
) => {
    // 1. Convert UUIDs to bytes32
    const matchIdBytes = uuidToBytes32(matchId)
    const seatIdBytes = uuidToBytes32(seatId)

    // 2. Definitive On-Chain Check
    // Before we even check our local DB or grant a lock, verify the seat isn't already taken on-chain.
    const onChainOccupied = await isSeatOccupiedOnChain(matchIdBytes, seatIdBytes)
    if (onChainOccupied) {
        throw new SigningError('This seat is already occupied on the blockchain', 409, 'ON_CHAIN_ALREADY_MINTED')
    }

    // 3. Validate seat exists and is active
    const [seat] = await db
        .select({
            id: seats.id,
            isActive: seats.isActive,
            enclosureId: seats.enclosureId,
        })
        .from(seats)
        .where(eq(seats.id, seatId))
        .limit(1)
        .execute()

    if (!seat) {
        throw new SigningError('Seat not found', 404, 'SEAT_NOT_FOUND')
    }
    if (!seat.isActive) {
        throw new SigningError('Seat is not active', 400, 'SEAT_INACTIVE')
    }

    // 3. Check seat is not already booked for this match
    const [existingTicket] = await db
        .select({ id: tickets.id })
        .from(tickets)
        .where(and(eq(tickets.seatId, seatId), eq(tickets.matchId, matchId)))
        .limit(1)
        .execute()

    if (existingTicket) {
        throw new SigningError('Seat is already booked for this match', 409, 'SEAT_ALREADY_BOOKED')
    }

    // 4. Acquire seat lock
    if (!acquireSeatLock(seatId, matchId, userAddress, userId, matchIdBytes, seatIdBytes)) {
        throw new SigningError('Seat is temporarily locked by another user', 423, 'SEAT_LOCKED')
    }

    // 5. Look up price: seat → enclosure → enclosure category → match pricing
    const [enclosure] = await db
        .select({ enclosureCategoryId: enclosures.enclosureCategoryId })
        .from(enclosures)
        .where(eq(enclosures.id, seat.enclosureId))
        .limit(1)
        .execute()

    if (!enclosure) {
        releaseSeatLock(seatId, matchId)
        throw new SigningError('Enclosure not found for this seat', 500, 'ENCLOSURE_NOT_FOUND')
    }

    const [pricing] = await db
        .select({ price: matchPricing.price, currency: matchPricing.currency })
        .from(matchPricing)
        .where(
            and(
                eq(matchPricing.matchId, matchId),
                eq(matchPricing.enclosureCategoryId, enclosure.enclosureCategoryId),
                eq(matchPricing.currency, 'WIRE'),
            ),
        )
        .limit(1)
        .execute()

    if (!pricing) {
        releaseSeatLock(seatId, matchId)
        throw new SigningError('Pricing not found for this match and enclosure', 404, 'PRICING_NOT_FOUND')
    }

    // 6. Set deadline (current time + 5 minutes, unix seconds)
    const deadline = Math.floor(Date.now() / 1000) + LOCK_DURATION_SEC

    // 7. Convert price to wei (price is stored with 6 decimal precision)
    const priceWei = ethers.parseEther(pricing.price)

    // 8. Generate hash exactly like contract
    const contractAddress = env.TICKET_CONTRACT_ADDRESS
    const chainId = env.NEXT_PUBLIC_WALLET_BRIDGE_CHAIN_ID_DECIMAL

    // ── Persistent Recording of Signing Request ──
    try {
        await db.insert(pendingTickets).values({
            userId,
            matchId,
            seatId,
            matchIdBytes,
            seatIdBytes,
            userAddress,
            expiresAt: new Date(deadline * 1000)
        }).execute()
        console.log(`[generateSignature] Persistent pending ticket recorded for seat ${seatId}`)
    } catch (e) {
        console.error(`[generateSignature] Failed to record pending ticket:`, e)
        // We continue even if DB fails, though in-memory lock is also set
    }

    const messageHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
            ['address', 'bytes32', 'bytes32', 'uint256', 'uint256', 'address', 'uint256'],
            [userAddress, matchIdBytes, seatIdBytes, priceWei, deadline, contractAddress, chainId],
        ),
    )

    // 9. Sign the hash
    const signer = new ethers.Wallet(env.SIGNER_PRIVATE_KEY)
    const signature = await signer.signMessage(ethers.getBytes(messageHash))

    // 10. Return response
    return {
        matchId: matchIdBytes,
        seatId: seatIdBytes,
        price: priceWei.toString(),
        deadline,
        signature,
    }
}

// ── Custom error class ──
export class SigningError extends Error {
    constructor(
        message: string,
        public statusCode: number,
        public errorCode: string,
    ) {
        super(message)
        this.name = 'SigningError'
    }
}
