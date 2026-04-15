"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, Tag, Loader2 } from "lucide-react"
import { toast } from "sonner"

type Category = {
  id: string
  name: string
  createdAt: string
}

export default function EnclosureCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [name, setName] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/enclosure-categories")
      const json = await res.json()
      if (json.success) setCategories(json.data)
    } catch {
      toast.error("Failed to load categories")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCategories() }, [])

  const openCreate = () => {
    setEditing(null)
    setName("")
    setDialogOpen(true)
  }

  const openEdit = (cat: Category) => {
    setEditing(cat)
    setName(cat.name)
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error("Name is required"); return }
    setSubmitting(true)
    try {
      const url = editing ? `/api/enclosure-categories/${editing.id}` : "/api/enclosure-categories"
      const method = editing ? "PATCH" : "POST"
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) })
      const json = await res.json()
      if (json.success) {
        toast.success(editing ? "Category updated" : "Category created")
        setDialogOpen(false)
        fetchCategories()
      } else {
        toast.error(json.message)
      }
    } catch {
      toast.error("Failed to save category")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return
    try {
      const res = await fetch(`/api/enclosure-categories/${id}`, { method: "DELETE" })
      const json = await res.json()
      if (json.success) {
        toast.success("Category deleted")
        fetchCategories()
      } else {
        toast.error(json.message)
      }
    } catch {
      toast.error("Failed to delete category")
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Enclosure Categories</h1>
          <p className="text-muted-foreground">Manage seat categories like VIP, General, Premium</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Category" : "New Category"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="catName">Category Name</Label>
                <Input id="catName" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. VIP, General, Premium" />
              </div>
              <Button onClick={handleSubmit} disabled={submitting} className="w-full">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? "Update" : "Create"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : categories.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No categories yet. Add one to get started.</CardContent></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {categories.map((cat) => (
            <Card key={cat.id} className="group transition-all hover:shadow-md hover:border-primary/30">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Tag className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-medium">{cat.name}</span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(cat)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(cat.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
