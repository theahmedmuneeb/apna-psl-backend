/* eslint-disable @next/next/no-img-element */
"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { Button, ButtonLoading } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { RichTextEditor } from "@/components/ui/rich-text-editor"

type StoryRow = {
  id: string
  title: string
  content: string
  thumbnail: string
  isFeatured: boolean
  createdAt: string
  updatedAt: string
}

type StoryEditorState = {
  id?: string
  title: string
  content: string
  isFeatured: boolean
}

const emptyEditorState: StoryEditorState = {
  title: "",
  content: "",
  isFeatured: false,
}

const editorModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["blockquote", "code-block", "link"],
    ["clean"],
  ],
}

export function StoriesClient() {
  const [storiesList, setStoriesList] = useState<StoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [createState, setCreateState] = useState<StoryEditorState>(emptyEditorState)
  const [editState, setEditState] = useState<StoryEditorState>(emptyEditorState)
  const [createThumbnailFile, setCreateThumbnailFile] = useState<File | null>(null)
  const [editThumbnailFile, setEditThumbnailFile] = useState<File | null>(null)
  const [editingStoryId, setEditingStoryId] = useState<string | null>(null)
  const [deletingStoryId, setDeletingStoryId] = useState<string | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const fetchStories = async () => {
    try {
      const res = await fetch("/api/stories")
      const json = await res.json()
      if (json.success) setStoriesList(json.data)
    } catch {
      toast.error("Failed to load stories")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStories() }, [])

  const createContentError = useMemo(() => {
    return createState.content.replace(/<(.|\n)*?>/g, "").trim().length === 0
  }, [createState.content])

  const editContentError = useMemo(() => {
    return editState.content.replace(/<(.|\n)*?>/g, "").trim().length === 0
  }, [editState.content])

  const handleCreateSubmit = async () => {
    if (!createState.title.trim() || createContentError) {
      toast.error("Title and content are required.")
      return
    }

    if (!createThumbnailFile) {
      toast.error("Thumbnail image is required.")
      return
    }

    setIsCreating(true)
    try {
      const formData = new FormData()
      formData.set("title", createState.title.trim())
      formData.set("thumbnailFile", createThumbnailFile)
      formData.set("content", createState.content)
      formData.set("isFeatured", String(createState.isFeatured))

      const res = await fetch("/api/stories", { method: "POST", body: formData })
      const json = await res.json()

      if (!json.success) {
        toast.error(json.message)
        return
      }

      toast.success(json.message)
      setCreateState(emptyEditorState)
      setCreateThumbnailFile(null)
      fetchStories()
    } catch {
      toast.error("Failed to create story")
    } finally {
      setIsCreating(false)
    }
  }

  const openEditDialog = (story: StoryRow) => {
    setEditingStoryId(story.id)
    setEditState({
      id: story.id,
      title: story.title,
      content: story.content,
      isFeatured: story.isFeatured,
    })
    setEditThumbnailFile(null)
    setIsEditDialogOpen(true)
  }

  const handleUpdateSubmit = async () => {
    if (!editState.id) {
      toast.error("Missing story id.")
      return
    }

    const storyId = editState.id

    if (!editState.title.trim() || editContentError) {
      toast.error("Title and content are required.")
      return
    }

    setIsUpdating(true)
    try {
      const formData = new FormData()
      formData.set("title", editState.title.trim())
      if (editThumbnailFile) {
        formData.set("thumbnailFile", editThumbnailFile)
      }
      formData.set("content", editState.content)
      formData.set("isFeatured", String(editState.isFeatured))

      const res = await fetch(`/api/stories/${storyId}`, { method: "PATCH", body: formData })
      const json = await res.json()

      if (!json.success) {
        toast.error(json.message)
        return
      }

      toast.success(json.message)
      setIsEditDialogOpen(false)
      setEditingStoryId(null)
      setEditState(emptyEditorState)
      setEditThumbnailFile(null)
      fetchStories()
    } catch {
      toast.error("Failed to update story")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async (storyId: string) => {
    setDeletingStoryId(storyId)
    setIsDeleting(true)

    try {
      const res = await fetch(`/api/stories/${storyId}`, { method: "DELETE" })
      const json = await res.json()

      if (!json.success) {
        toast.error(json.message)
        return
      }

      toast.success(json.message)
      fetchStories()
    } catch {
      toast.error("Failed to delete story")
    } finally {
      setDeletingStoryId(null)
      setIsDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="container py-6">
        <p className="text-muted-foreground">Loading stories...</p>
      </div>
    )
  }

  return (
    <div className="container py-6 space-y-6">
      <section className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Stories</h1>
        <p className="text-muted-foreground">
          Create and manage public news stories. Frontend apps should consume these from the API.
        </p>
      </section>

      <section className="space-y-4 rounded-xl border bg-card p-5 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-lg font-medium">Create Story</h2>
          <p className="text-sm text-muted-foreground">
            Add title, thumbnail and rich content. Feature stories when needed.
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="create-title" className="text-sm font-medium">
            Title
          </label>
          <Input
            id="create-title"
            value={createState.title}
            onChange={(event) =>
              setCreateState((prev) => ({ ...prev, title: event.target.value }))
            }
            placeholder="Enter title"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="create-thumbnail" className="text-sm font-medium">
            Thumbnail Upload
          </label>
          <Input
            id="create-thumbnail"
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null
              setCreateThumbnailFile(file)
            }}
          />
          <p className="text-xs text-muted-foreground">
            Thumbnail image will be uploaded to Supabase Storage.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Content</label>
          <RichTextEditor
            value={createState.content}
            onChange={(value: string) =>
              setCreateState((prev) => ({ ...prev, content: value }))
            }
            modules={editorModules}
            placeholder="Write your story here..."
          />
          {createContentError ? (
            <p className="text-xs text-destructive">Content is required.</p>
          ) : null}
        </div>

        <label className="inline-flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={createState.isFeatured}
            onChange={(event) =>
              setCreateState((prev) => ({ ...prev, isFeatured: event.target.checked }))
            }
          />
          Mark as featured
        </label>

        <div className="pt-1">
          <ButtonLoading isLoading={isCreating} disabled={isCreating} onClick={handleCreateSubmit}>
            Create Story
          </ButtonLoading>
        </div>
      </section>

      <section className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="border-b p-5">
          <h2 className="text-lg font-medium">Manage Stories</h2>
          <p className="text-sm text-muted-foreground">Edit, feature, or delete existing stories.</p>
        </div>

        {storiesList.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">No stories found yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Thumbnail</th>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Featured</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {storiesList.map((story) => (
                  <tr key={story.id} className="border-b last:border-b-0 align-top">
                    <td className="px-4 py-3">
                      <img
                        src={story.thumbnail}
                        alt={story.title}
                        className="h-14 w-24 rounded-md border object-cover bg-muted"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium">{story.title}</td>
                    <td className="px-4 py-3">{story.isFeatured ? "Yes" : "No"}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(story)}
                        >
                          Edit
                        </Button>
                        <ButtonLoading
                          type="button"
                          variant="destructive"
                          size="sm"
                          isLoading={isDeleting && deletingStoryId === story.id}
                          disabled={isDeleting || isCreating || isUpdating}
                          onClick={() => handleDelete(story.id)}
                        >
                          Delete
                        </ButtonLoading>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open)
          if (!open) {
            setEditingStoryId(null)
            setEditState(emptyEditorState)
            setEditThumbnailFile(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Story</DialogTitle>
            <DialogDescription>Update story details and publish changes.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="edit-title" className="text-sm font-medium">
                Title
              </label>
              <Input
                id="edit-title"
                value={editState.title}
                onChange={(event) =>
                  setEditState((prev) => ({ ...prev, title: event.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="edit-thumbnail" className="text-sm font-medium">
                Replace Thumbnail (optional)
              </label>
              <Input
                id="edit-thumbnail"
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null
                  setEditThumbnailFile(file)
                }}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to keep the existing thumbnail.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Content</label>
              <RichTextEditor
                value={editState.content}
                onChange={(value: string) =>
                  setEditState((prev) => ({ ...prev, content: value }))
                }
                modules={editorModules}
              />
              {editContentError ? (
                <p className="text-xs text-destructive">Content is required.</p>
              ) : null}
            </div>

            <label className="inline-flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={editState.isFeatured}
                onChange={(event) =>
                  setEditState((prev) => ({ ...prev, isFeatured: event.target.checked }))
                }
              />
              Mark as featured
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <ButtonLoading
              type="button"
              isLoading={isUpdating && editingStoryId === editState.id}
              disabled={isUpdating || isCreating || isDeleting}
              onClick={handleUpdateSubmit}
            >
              Save Changes
            </ButtonLoading>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
