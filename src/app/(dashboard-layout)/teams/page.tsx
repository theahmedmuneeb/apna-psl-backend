import { revalidatePath } from "next/cache"
import { desc, eq } from "drizzle-orm"

import { db } from "@/db"
import { teams } from "@/db/schema"
import { env } from "@/env"
import { createSupabaseAdminClient } from "@/lib/supabase"
import { TeamsClient } from "./teams-client"

type TeamRow = typeof teams.$inferSelect
export type TeamActionResult = {
  success: boolean
  message: string
}

function sanitizeFileName(fileName: string) {
  return fileName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

function parseSportmonksTeamId(value: FormDataEntryValue | null): number | null {
  const parsed = Number.parseInt(String(value ?? "").trim(), 10)

  if (!Number.isInteger(parsed) || parsed < 0) {
    return null
  }

  return parsed
}

async function createTeamAction(formData: FormData) {
  "use server"

  try {
    const name = String(formData.get("name") ?? "").trim()
    const shortName = String(formData.get("shortName") ?? "").trim()
    const sportmonksTeamId = parseSportmonksTeamId(formData.get("sportmonksTeamId"))
    const logoFile = formData.get("logoFile")

    if (!name || !shortName || sportmonksTeamId === null) {
      return {
        success: false,
        message: "Name, short name, and Sportmonks Team ID are required.",
      } satisfies TeamActionResult
    }

    if (!(logoFile instanceof File) || logoFile.size === 0) {
      return {
        success: false,
        message: "Team logo is required.",
      } satisfies TeamActionResult
    }

    const supabaseAdmin = createSupabaseAdminClient()
    const fileExtension = logoFile.name.includes(".")
      ? logoFile.name.split(".").pop()
      : "png"
    const fileName = `${Date.now()}-${sanitizeFileName(shortName)}.${fileExtension}`
    const filePath = `team-logos/${fileName}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from(env.SUPABASE_STORAGE_BUCKET)
      .upload(filePath, Buffer.from(await logoFile.arrayBuffer()), {
        contentType: logoFile.type || "image/png",
        upsert: false,
      })

    if (uploadError) {
      return {
        success: false,
        message: uploadError.message,
      } satisfies TeamActionResult
    }

    await db.insert(teams).values({
      name,
      shortName,
      sportmonksTeamId,
      logoUrl: filePath,
    })

    revalidatePath("/teams")
    return {
      success: true,
      message: "Team added successfully.",
    } satisfies TeamActionResult
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to add team.",
    } satisfies TeamActionResult
  }
}

async function updateTeamAction(formData: FormData) {
  "use server"

  try {
    const teamId = String(formData.get("teamId") ?? "").trim()
    const name = String(formData.get("name") ?? "").trim()
    const shortName = String(formData.get("shortName") ?? "").trim()
    const sportmonksTeamId = parseSportmonksTeamId(formData.get("sportmonksTeamId"))
    const logoFile = formData.get("logoFile")

    if (!teamId || !name || !shortName || sportmonksTeamId === null) {
      return {
        success: false,
        message: "Team id, name, short name, and Sportmonks Team ID are required.",
      } satisfies TeamActionResult
    }

    const supabaseAdmin = createSupabaseAdminClient()
    const [existingTeam] = await db
      .select({ id: teams.id, logoUrl: teams.logoUrl })
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1)

    if (!existingTeam) {
      return {
        success: false,
        message: "Team not found.",
      } satisfies TeamActionResult
    }

    let nextLogoPath: string | null = existingTeam.logoUrl

    if (logoFile instanceof File && logoFile.size > 0) {
      const fileExtension = logoFile.name.includes(".")
        ? logoFile.name.split(".").pop()
        : "png"
      const fileName = `${Date.now()}-${sanitizeFileName(shortName)}.${fileExtension}`
      const filePath = `team-logos/${fileName}`

      const { error: uploadError } = await supabaseAdmin.storage
        .from(env.SUPABASE_STORAGE_BUCKET)
        .upload(filePath, Buffer.from(await logoFile.arrayBuffer()), {
          contentType: logoFile.type || "image/png",
          upsert: false,
        })

      if (uploadError) {
        return {
          success: false,
          message: uploadError.message,
        } satisfies TeamActionResult
      }

      nextLogoPath = filePath
    }

    await db
      .update(teams)
      .set({
        name,
        shortName,
        sportmonksTeamId,
        logoUrl: nextLogoPath,
        updatedAt: new Date(),
      })
      .where(eq(teams.id, teamId))

    if (
      logoFile instanceof File &&
      logoFile.size > 0 &&
      existingTeam.logoUrl &&
      existingTeam.logoUrl !== nextLogoPath
    ) {
      await supabaseAdmin.storage
        .from(env.SUPABASE_STORAGE_BUCKET)
        .remove([existingTeam.logoUrl])
    }

    revalidatePath("/teams")
    return {
      success: true,
      message: "Team updated successfully.",
    } satisfies TeamActionResult
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update team.",
    } satisfies TeamActionResult
  }
}

async function deleteTeamAction(formData: FormData) {
  "use server"

  try {
    const teamId = String(formData.get("teamId") ?? "").trim()

    if (!teamId) {
      return {
        success: false,
        message: "Missing team id.",
      } satisfies TeamActionResult
    }

    const supabaseAdmin = createSupabaseAdminClient()
    const [team] = await db
      .select({ id: teams.id, logoUrl: teams.logoUrl })
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1)

    if (team?.logoUrl) {
      await supabaseAdmin.storage
        .from(env.SUPABASE_STORAGE_BUCKET)
        .remove([team.logoUrl])
    }

    await db.delete(teams).where(eq(teams.id, teamId))
    revalidatePath("/teams")

    return {
      success: true,
      message: "Team deleted successfully.",
    } satisfies TeamActionResult
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to delete team.",
    } satisfies TeamActionResult
  }
}

async function getTeams(): Promise<TeamRow[]> {
  return db.select().from(teams).orderBy(desc(teams.createdAt))
}

export default async function TeamsPage() {
  const teamsList = await getTeams()

  return (
    <TeamsClient
      teamsList={teamsList}
      supabaseBaseUrl={env.NEXT_PUBLIC_SUPABASE_URL}
      logosBucket={env.SUPABASE_STORAGE_BUCKET}
      createTeamAction={createTeamAction}
      updateTeamAction={updateTeamAction}
      deleteTeamAction={deleteTeamAction}
    />
  )
}