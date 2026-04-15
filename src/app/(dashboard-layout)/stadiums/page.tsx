"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, Building2, Loader2, MapPin, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

type Stadium = {
  id: string
  name: string
  location: string
  sportmonksVenueId: number
  createdAt: string
}

export default function StadiumsPage() {
  const [stadiums, setStadiums] = useState<Stadium[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Stadium | null>(null)
  const [form, setForm] = useState({ name: "", location: "", sportmonksVenueId: "" })
  const [submitting, setSubmitting] = useState(false)

  const fetchStadiums = async () => {
    try {
      const res = await fetch("/api/stadiums")
      const json = await res.json()
      if (json.success) setStadiums(json.data)
    } catch {
      toast.error("Failed to load stadiums")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStadiums() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ name: "", location: "", sportmonksVenueId: "" })
    setDialogOpen(true)
  }

  const openEdit = (s: Stadium) => {
    setEditing(s)
    setForm({ name: s.name, location: s.location, sportmonksVenueId: String(s.sportmonksVenueId) })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.name || !form.location || !form.sportmonksVenueId) {
      toast.error("All fields are required")
      return
    }
    setSubmitting(true)
    try {
      const body = {
        name: form.name,
        location: form.location,
        sportmonksVenueId: parseInt(form.sportmonksVenueId, 10),
      }
      const url = editing ? `/api/stadiums/${editing.id}` : "/api/stadiums"
      const method = editing ? "PATCH" : "POST"
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      const json = await res.json()
      if (json.success) {
        toast.success(editing ? "Stadium updated" : "Stadium created")
        setDialogOpen(false)
        fetchStadiums()
      } else {
        toast.error(json.message)
      }
    } catch {
      toast.error("Failed to save stadium")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this stadium?")) return
    try {
      const res = await fetch(`/api/stadiums/${id}`, { method: "DELETE" })
      const json = await res.json()
      if (json.success) {
        toast.success("Stadium deleted")
        fetchStadiums()
      } else {
        toast.error(json.message)
      }
    } catch {
      toast.error("Failed to delete stadium")
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stadiums</h1>
          <p className="text-muted-foreground">Manage stadiums and their enclosures</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> Add Stadium
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Stadium" : "New Stadium"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. National Stadium" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Karachi, Pakistan" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="venueId">SportMonks Venue ID</Label>
                <Input id="venueId" type="number" value={form.sportmonksVenueId} onChange={(e) => setForm({ ...form, sportmonksVenueId: e.target.value })} placeholder="e.g. 12345" />
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
      ) : stadiums.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No stadiums yet. Add one to get started.</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stadiums.map((s) => (
            <Card key={s.id} className="group relative overflow-hidden transition-all hover:shadow-lg hover:border-primary/30">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{s.name}</CardTitle>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {s.location}
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                  Venue ID: {s.sportmonksVenueId}
                </div>
                <Link href={`/stadiums/${s.id}/enclosures`} className="inline-flex items-center gap-1 text-sm text-primary hover:underline font-medium">
                  Manage Enclosures <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
