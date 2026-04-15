"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
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
import { Plus, Pencil, Trash2, Loader2, ArrowRight, Layers, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

type Category = { id: string; name: string }
type Enclosure = {
  id: string
  name: string
  stadiumId: string
  enclosureCategoryId: string
  config: Record<string, unknown> | null
  createdAt: string
}
type Stadium = { id: string; name: string; location: string }

export default function EnclosuresPage() {
  const params = useParams()
  const stadiumId = params.stadiumId as string

  const [enclosures, setEnclosures] = useState<Enclosure[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [stadium, setStadium] = useState<Stadium | null>(null)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Enclosure | null>(null)
  const [form, setForm] = useState({ name: "", enclosureCategoryId: "", config: "" })
  const [submitting, setSubmitting] = useState(false)

  const fetchData = async () => {
    try {
      const [encRes, catRes, stadRes] = await Promise.all([
        fetch(`/api/enclosures?stadiumId=${stadiumId}`),
        fetch("/api/enclosure-categories"),
        fetch(`/api/stadiums/${stadiumId}`),
      ])
      const [encJson, catJson, stadJson] = await Promise.all([encRes.json(), catRes.json(), stadRes.json()])
      if (encJson.success) setEnclosures(encJson.data)
      if (catJson.success) setCategories(catJson.data)
      if (stadJson.success) setStadium(stadJson.data)
    } catch {
      toast.error("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [stadiumId])

  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? "—"

  const openCreate = () => {
    setEditing(null)
    setForm({ name: "", enclosureCategoryId: categories[0]?.id ?? "", config: "" })
    setDialogOpen(true)
  }

  const openEdit = (enc: Enclosure) => {
    setEditing(enc)
    setForm({ name: enc.name, enclosureCategoryId: enc.enclosureCategoryId, config: enc.config ? JSON.stringify(enc.config, null, 2) : "" })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.name || !form.enclosureCategoryId) { toast.error("Name and category are required"); return }
    let parsedConfig = null
    if (form.config.trim()) {
      try { parsedConfig = JSON.parse(form.config) } catch { toast.error("Invalid JSON config"); return }
    }
    setSubmitting(true)
    try {
      const body = editing
        ? { name: form.name, enclosureCategoryId: form.enclosureCategoryId, config: parsedConfig }
        : { stadiumId, name: form.name, enclosureCategoryId: form.enclosureCategoryId, config: parsedConfig }
      const url = editing ? `/api/enclosures/${editing.id}` : "/api/enclosures"
      const method = editing ? "PATCH" : "POST"
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      const json = await res.json()
      if (json.success) {
        toast.success(editing ? "Enclosure updated" : "Enclosure created")
        setDialogOpen(false)
        fetchData()
      } else {
        toast.error(json.message)
      }
    } catch {
      toast.error("Failed to save enclosure")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this enclosure and all its seats?")) return
    try {
      const res = await fetch(`/api/enclosures/${id}`, { method: "DELETE" })
      const json = await res.json()
      if (json.success) { toast.success("Enclosure deleted"); fetchData() }
      else toast.error(json.message)
    } catch { toast.error("Failed to delete") }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Link href="/stadiums" className="hover:text-foreground flex items-center gap-1"><ArrowLeft className="h-3.5 w-3.5" /> Stadiums</Link>
        <span>/</span>
        <span className="text-foreground font-medium">{stadium?.name ?? "..."}</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Enclosures</h1>
          <p className="text-muted-foreground">{stadium?.name ? `Manage enclosures in ${stadium.name}` : "Loading..."}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} disabled={categories.length === 0}>
              <Plus className="mr-2 h-4 w-4" /> Add Enclosure
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Enclosure" : "New Enclosure"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. West Stand Block A" />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.enclosureCategoryId}
                  onChange={(e) => setForm({ ...form, enclosureCategoryId: e.target.value })}
                >
                  <option value="">Select category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Config (JSON, optional)</Label>
                <textarea
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono min-h-[100px] resize-y"
                  value={form.config}
                  onChange={(e) => setForm({ ...form, config: e.target.value })}
                  placeholder='{"displayName": "VIP West", "color": "#FFD700"}'
                />
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
      ) : enclosures.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          {categories.length === 0 ? "Create enclosure categories first before adding enclosures." : "No enclosures yet. Add one to get started."}
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {enclosures.map((enc) => (
            <Card key={enc.id} className="group transition-all hover:shadow-lg hover:border-primary/30">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-primary/10 p-2"><Layers className="h-5 w-5 text-primary" /></div>
                    <div>
                      <CardTitle className="text-lg">{enc.name}</CardTitle>
                      <span className="text-xs text-muted-foreground">{catName(enc.enclosureCategoryId)}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(enc)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(enc.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {enc.config && (
                  <div className="mb-3 text-xs font-mono bg-muted/50 rounded p-2 max-h-20 overflow-auto">
                    {JSON.stringify(enc.config, null, 2)}
                  </div>
                )}
                <Link href={`/stadiums/${stadiumId}/enclosures/${enc.id}/seats`} className="inline-flex items-center gap-1 text-sm text-primary hover:underline font-medium">
                  Manage Seats <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
