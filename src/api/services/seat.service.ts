import { db } from '@/db'
import { seats } from '@/db/schema'
import { and, eq, asc } from 'drizzle-orm'
import type { BulkCreateSeatsInput, SyncSeatsInput, UpdateSeatInput } from '@/api/schemas/seat.schema'

export const getSeatsByEnclosure = async (enclosureId: string) => {
    return db
        .select()
        .from(seats)
        .where(eq(seats.enclosureId, enclosureId))
        .orderBy(asc(seats.rowLabel), asc(seats.seatNumber))
        .execute()
}

export const bulkCreateSeats = async (data: BulkCreateSeatsInput) => {
    const values = data.rows.flatMap((row) =>
        row.seats.map((seat) => ({
            enclosureId: data.enclosureId,
            rowLabel: row.rowLabel,
            seatNumber: seat.seatNumber,
            label: seat.label,
            isActive: true,
        }))
    )

    if (values.length === 0) return []

    return db.insert(seats).values(values).returning().execute()
}

/**
 * Diff-based seat sync: compares existing seats against new config.
 * - UPDATE existing seats where (rowLabel, seatNumber) matches
 * - INSERT new seats not found in existing
 * - SOFT DELETE (isActive = false) existing seats not in new config
 *
 * This ensures seat IDs remain stable for future ticket/blockchain mapping.
 */
export const syncSeats = async (data: SyncSeatsInput) => {
    const existing = await db
        .select()
        .from(seats)
        .where(eq(seats.enclosureId, data.enclosureId))
        .execute()

    // Build a map of existing seats keyed by "rowLabel::seatNumber"
    const existingMap = new Map(
        existing.map((s) => [`${s.rowLabel}::${s.seatNumber}`, s])
    )

    // Build a set of new seat keys
    const newSeatKeys = new Set<string>()
    const newSeats: { rowLabel: string; seatNumber: number; label: string }[] = []
    const updates: { id: string; rowLabel: string; seatNumber: number; label: string }[] = []

    for (const row of data.rows) {
        for (const seat of row.seats) {
            const key = `${row.rowLabel}::${seat.seatNumber}`
            newSeatKeys.add(key)

            const existingSeat = existingMap.get(key)
            if (existingSeat) {
                // UPDATE: seat exists, update label and reactivate if needed
                if (existingSeat.label !== seat.label || !existingSeat.isActive) {
                    updates.push({
                        id: existingSeat.id,
                        rowLabel: row.rowLabel,
                        seatNumber: seat.seatNumber,
                        label: seat.label,
                    })
                }
            } else {
                // INSERT: new seat
                newSeats.push({
                    rowLabel: row.rowLabel,
                    seatNumber: seat.seatNumber,
                    label: seat.label,
                })
            }
        }
    }

    // SOFT DELETE: deactivate seats no longer present
    const toDeactivate = existing.filter(
        (s) => !newSeatKeys.has(`${s.rowLabel}::${s.seatNumber}`) && s.isActive
    )

    const now = new Date()

    // Execute updates
    for (const upd of updates) {
        await db
            .update(seats)
            .set({ label: upd.label, isActive: true, updatedAt: now })
            .where(eq(seats.id, upd.id))
            .execute()
    }

    // Execute soft deletes
    for (const seat of toDeactivate) {
        await db
            .update(seats)
            .set({ isActive: false, updatedAt: now })
            .where(eq(seats.id, seat.id))
            .execute()
    }

    // Execute inserts
    if (newSeats.length > 0) {
        await db
            .insert(seats)
            .values(
                newSeats.map((s) => ({
                    enclosureId: data.enclosureId,
                    rowLabel: s.rowLabel,
                    seatNumber: s.seatNumber,
                    label: s.label,
                    isActive: true,
                }))
            )
            .execute()
    }

    // Return final state
    return getSeatsByEnclosure(data.enclosureId)
}

export const updateSeat = async (id: string, data: UpdateSeatInput) => {
    const [seat] = await db
        .update(seats)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(seats.id, id))
        .returning()
        .execute()
    return seat ?? null
}
