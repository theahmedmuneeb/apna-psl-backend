import { db } from '@/db'
import { tickets, matches, seats, profiles, enclosureCategories, teams, stadiums, enclosures } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { toPKTString } from '@/lib/utils'
import type { CreateTicketInput, UpdateTicketInput } from '@/api/schemas/ticket.schema'

const teamA = alias(teams, 'teamA')
const teamB = alias(teams, 'teamB')

const ticketSelect = {
    id: tickets.id,
    status: tickets.status,
    walletAddress: tickets.walletAddress,
    nftContractAddress: tickets.nftContractAddress,
    nftTokenId: tickets.nftTokenId,
    nftMetadata: tickets.nftMetadata,
    createdAt: tickets.createdAt,
    owner: {
        id: profiles.id,
        fullName: profiles.fullName,
        walletAddress: profiles.walletAddress,
    },
    match: {
        id: matches.id,
        startTime: matches.startTime,
    },
    teamA: {
        id: teamA.id,
        name: teamA.name,
        shortName: teamA.shortName,
        logoUrl: teamA.logoUrl,
    },
    teamB: {
        id: teamB.id,
        name: teamB.name,
        shortName: teamB.shortName,
        logoUrl: teamB.logoUrl,
    },
    stadium: {
        id: stadiums.id,
        name: stadiums.name,
        location: stadiums.location,
    },
    seat: {
        id: seats.id,
        rowLabel: seats.rowLabel,
        seatNumber: seats.seatNumber,
        label: seats.label,
    },
    enclosure: {
        id: enclosures.id,
        name: enclosures.name,
    },
    enclosureCategory: {
        id: enclosureCategories.id,
        name: enclosureCategories.name,
    },
}

const ticketBaseQuery = () =>
    db
        .select(ticketSelect)
        .from(tickets)
        .leftJoin(profiles, eq(tickets.ownerId, profiles.id))
        .innerJoin(matches, eq(tickets.matchId, matches.id))
        .innerJoin(teamA, eq(matches.teamAId, teamA.id))
        .innerJoin(teamB, eq(matches.teamBId, teamB.id))
        .innerJoin(stadiums, eq(matches.stadiumId, stadiums.id))
        .innerJoin(seats, eq(tickets.seatId, seats.id))
        .innerJoin(enclosures, eq(seats.enclosureId, enclosures.id))
        .innerJoin(enclosureCategories, eq(tickets.enclosureCategoryId, enclosureCategories.id))

const formatTicketResponse = (ticket: any) => {
    if (!ticket) return null
    return {
        ...ticket,
        createdAt: toPKTString(ticket.createdAt),
        match: ticket.match ? {
            ...ticket.match,
            startTime: toPKTString(ticket.match.startTime)
        } : ticket.match
    }
}

export const getAllTickets = async () => {
    const data = await ticketBaseQuery()
        .orderBy(desc(tickets.createdAt))
        .execute()
    return data.map(formatTicketResponse)
}

export const getTicketById = async (id: string) => {
    const [ticket] = await ticketBaseQuery()
        .where(eq(tickets.id, id))
        .limit(1)
        .execute()
    return formatTicketResponse(ticket)
}

export const getTicketsByMatch = async (matchId: string) => {
    const data = await ticketBaseQuery()
        .where(eq(tickets.matchId, matchId))
        .orderBy(desc(tickets.createdAt))
        .execute()
    return data.map(formatTicketResponse)
}

export const getTicketsByOwner = async (ownerId: string) => {
    const data = await ticketBaseQuery()
        .where(eq(tickets.ownerId, ownerId))
        .orderBy(desc(tickets.createdAt))
        .execute()
    return data.map(formatTicketResponse)
}

export const getTicketsByWallet = async (walletAddress: string) => {
    const data = await ticketBaseQuery()
        .where(eq(tickets.walletAddress, walletAddress.toLowerCase()))
        .orderBy(desc(tickets.createdAt))
        .execute()
    return data.map(formatTicketResponse)
}

export const createTicket = async (data: CreateTicketInput) => {
    const [ticket] = await db
        .insert(tickets)
        .values({
            ownerId: data.ownerId ?? null,
            walletAddress: data.walletAddress.toLowerCase(),
            matchId: data.matchId,
            seatId: data.seatId,
            enclosureCategoryId: data.enclosureCategoryId,
            nftContractAddress: data.nftContractAddress ?? null,
            nftTokenId: data.nftTokenId ?? null,
            nftMetadata: data.nftMetadata ?? null,
            status: data.status ?? 'valid',
        })
        .returning()
        .execute()
    return ticket
}

export const updateTicket = async (id: string, data: UpdateTicketInput) => {
    const updateData: Record<string, unknown> = { updatedAt: new Date() }
    if (data.ownerId !== undefined) updateData.ownerId = data.ownerId
    if (data.walletAddress !== undefined) updateData.walletAddress = data.walletAddress.toLowerCase()
    if (data.status !== undefined) updateData.status = data.status
    if (data.nftContractAddress !== undefined) updateData.nftContractAddress = data.nftContractAddress
    if (data.nftTokenId !== undefined) updateData.nftTokenId = data.nftTokenId
    if (data.nftMetadata !== undefined) updateData.nftMetadata = data.nftMetadata

    const [ticket] = await db
        .update(tickets)
        .set(updateData)
        .where(eq(tickets.id, id))
        .returning()
        .execute()
    return ticket ?? null
}

export const deleteTicket = async (id: string) => {
    const [ticket] = await db.delete(tickets).where(eq(tickets.id, id)).returning().execute()
    return ticket ?? null
}
