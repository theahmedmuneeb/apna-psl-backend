import { createServerClient } from "@supabase/ssr"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { desc, eq } from "drizzle-orm"

import { db } from "@/db"
import { stories } from "@/db/schema"
import { env } from "@/env"
import { createSupabaseAdminClient } from "@/lib/supabase"
import { StoriesClient } from "./stories-client"

type StoryRow = typeof stories.$inferSelect

type StoryActionResult = {
  success: boolean
  message: string
}

function isContentEmpty(content: string) {
  return content.replace(/<(.|\n)*?>/g, "").trim().length === 0
}

function sanitizeFileName(fileName: string) {
  return fileName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

function isStoragePath(value: string) {
  return !/^https?:\/\//i.test(value)
}

async function getCurrentAdminUserId() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set() {},
        remove() {},
      },
    }
  )

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user.id
}

async function createStoryAction(formData: FormData): Promise<StoryActionResult> {
  "use server"

  try {
    const userId = await getCurrentAdminUserId()

    if (!userId) {
      return {
        success: false,
        message: "Unauthorized user.",
      }
    }

    const title = String(formData.get("title") ?? "").trim()
    const content = String(formData.get("content") ?? "")
    const thumbnailFile = formData.get("thumbnailFile")
    const isFeatured = String(formData.get("isFeatured") ?? "false") === "true"

    if (!title || isContentEmpty(content)) {
      return {
        success: false,
        message: "Title and content are required.",
      }
    }

    if (!(thumbnailFile instanceof File) || thumbnailFile.size === 0) {
      return {
        success: false,
        message: "Thumbnail image is required.",
      }
    }

    const supabaseAdmin = createSupabaseAdminClient()
    const fileExtension = thumbnailFile.name.includes(".")
      ? thumbnailFile.name.split(".").pop()
      : "jpg"
    const fileName = `${Date.now()}-${sanitizeFileName(title)}.${fileExtension}`
    const filePath = `story-thumbnails/${fileName}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from(env.SUPABASE_STORAGE_BUCKET)
      .upload(filePath, Buffer.from(await thumbnailFile.arrayBuffer()), {
        contentType: thumbnailFile.type || "image/jpeg",
        upsert: false,
      })

    if (uploadError) {
      return {
        success: false,
        message: uploadError.message,
      }
    }

    await db.insert(stories).values({
      title,
      thumbnail: filePath,
      content,
      isFeatured,
      createdById: userId,
      updatedById: userId,
    })

    revalidatePath("/stories")

    return {
      success: true,
      message: "Story created successfully.",
    }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create story.",
    }
  }
}

async function updateStoryAction(formData: FormData): Promise<StoryActionResult> {
  "use server"

  try {
    const userId = await getCurrentAdminUserId()

    if (!userId) {
      return {
        success: false,
        message: "Unauthorized user.",
      }
    }

    const storyId = String(formData.get("storyId") ?? "").trim()
    const title = String(formData.get("title") ?? "").trim()
    const content = String(formData.get("content") ?? "")
    const thumbnailFile = formData.get("thumbnailFile")
    const isFeatured = String(formData.get("isFeatured") ?? "false") === "true"

    if (!storyId) {
      return {
        success: false,
        message: "Missing story id.",
      }
    }

    if (!title || isContentEmpty(content)) {
      return {
        success: false,
        message: "Title and content are required.",
      }
    }

    const [existingStory] = await db
      .select({ thumbnail: stories.thumbnail })
      .from(stories)
      .where(eq(stories.id, storyId))
      .limit(1)

    if (!existingStory) {
      return {
        success: false,
        message: "Story not found.",
      }
    }

    let nextThumbnail = existingStory.thumbnail

    if (thumbnailFile instanceof File && thumbnailFile.size > 0) {
      const supabaseAdmin = createSupabaseAdminClient()
      const fileExtension = thumbnailFile.name.includes(".")
        ? thumbnailFile.name.split(".").pop()
        : "jpg"
      const fileName = `${Date.now()}-${sanitizeFileName(title)}.${fileExtension}`
      const filePath = `story-thumbnails/${fileName}`

      const { error: uploadError } = await supabaseAdmin.storage
        .from(env.SUPABASE_STORAGE_BUCKET)
        .upload(filePath, Buffer.from(await thumbnailFile.arrayBuffer()), {
          contentType: thumbnailFile.type || "image/jpeg",
          upsert: false,
        })

      if (uploadError) {
        return {
          success: false,
          message: uploadError.message,
        }
      }

      if (isStoragePath(existingStory.thumbnail)) {
        await supabaseAdmin.storage
          .from(env.SUPABASE_STORAGE_BUCKET)
          .remove([existingStory.thumbnail])
      }

      nextThumbnail = filePath
    }

    await db
      .update(stories)
      .set({
        title,
        thumbnail: nextThumbnail,
        content,
        isFeatured,
        updatedById: userId,
        updatedAt: new Date(),
      })
      .where(eq(stories.id, storyId))

    revalidatePath("/stories")

    return {
      success: true,
      message: "Story updated successfully.",
    }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update story.",
    }
  }
}

async function deleteStoryAction(formData: FormData): Promise<StoryActionResult> {
  "use server"

  try {
    const userId = await getCurrentAdminUserId()

    if (!userId) {
      return {
        success: false,
        message: "Unauthorized user.",
      }
    }

    const storyId = String(formData.get("storyId") ?? "").trim()

    if (!storyId) {
      return {
        success: false,
        message: "Missing story id.",
      }
    }

    const [story] = await db
      .select({ thumbnail: stories.thumbnail })
      .from(stories)
      .where(eq(stories.id, storyId))
      .limit(1)

    if (story?.thumbnail && isStoragePath(story.thumbnail)) {
      const supabaseAdmin = createSupabaseAdminClient()
      await supabaseAdmin.storage
        .from(env.SUPABASE_STORAGE_BUCKET)
        .remove([story.thumbnail])
    }

    await db.delete(stories).where(eq(stories.id, storyId))

    revalidatePath("/stories")

    return {
      success: true,
      message: "Story deleted successfully.",
    }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to delete story.",
    }
  }
}

async function getStories(): Promise<StoryRow[]> {
  return db.select().from(stories).orderBy(desc(stories.createdAt))
}

export default async function StoriesPage() {
  const storiesList = await getStories()

  return (
    <StoriesClient
      storiesList={storiesList}
      supabaseBaseUrl={env.NEXT_PUBLIC_SUPABASE_URL}
      storageBucket={env.SUPABASE_STORAGE_BUCKET}
      createStoryAction={createStoryAction}
      updateStoryAction={updateStoryAction}
      deleteStoryAction={deleteStoryAction}
    />
  )
}
