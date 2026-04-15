"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2, Plus, Trash2, DollarSign } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

type Category = { id: string; name: string }
type Pricing = {
  id: string
  matchId: string
  enclosureCategoryId: string
  categoryName: string
  price: string
  currency: "WIRE" | "PSL"
}
type Match = {
  id: string
  teamA: { shortName: string }
  teamB: { shortName: string }
  stadium: { name: string }
  startTime: string
}

export default function PricingPage() {
  const params = useParams()
  const matchId = params.matchId as string

  const [pricing, setPricing] = useState<Pricing[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [match, setMatch] = useState<Match | null>(null)
  const [loading, setLoading] = useState(true)

  // New pricing form
  const [newCategoryId, setNewCategoryId] = useState("")
  const [newPrice, setNewPrice] = useState("")
  const [newCurrency, setNewCurrency] = useState<"WIRE" | "PSL">("WIRE")
  const [submitting, setSubmitting] = useState(false)

  const fetchData = async () => {
    try {
      const [priceRes, catRes, matchRes] = await Promise.all([
        fetch(`/api/pricing?matchId=${matchId}`),
        fetch("/api/enclosure-categories"),
        fetch(`/api/matches/${matchId}`),
      ])
      const [priceJson, catJson, matchJson] = await Promise.all([priceRes.json(), catRes.json(), matchRes.json()])
      if (priceJson.success) setPricing(priceJson.data)
      if (catJson.success) setCategories(catJson.data)
      if (matchJson.success) setMatch(matchJson.data)
    } catch {
      toast.error("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [matchId])

  const usedCategories = new Set(pricing.map((p) => `${p.enclosureCategoryId}::${p.currency}`))
  const availableCategories = categories.filter((c) => !usedCategories.has(`${c.id}::${newCurrency}`))

  const handleCreate = async () => {
    if (!newCategoryId || !newPrice) { toast.error("Category and price required"); return }
    setSubmitting(true)
    try {
      const res = await fetch("/api/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, enclosureCategoryId: newCategoryId, price: newPrice, currency: newCurrency }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success("Pricing added")
        setNewPrice("")
        setNewCategoryId("")
        fetchData()
      } else toast.error(json.message)
    } catch { toast.error("Failed to create pricing") } finally { setSubmitting(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this pricing?")) return
    try {
      const res = await fetch(`/api/pricing/${id}`, { method: "DELETE" })
      const json = await res.json()
      if (json.success) { toast.success("Pricing removed"); fetchData() }
      else toast.error(json.message)
    } catch { toast.error("Failed to delete") }
  }

  const handleUpdate = async (id: string, price: string) => {
    try {
      const res = await fetch(`/api/pricing/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price }),
      })
      const json = await res.json()
      if (json.success) toast.success("Price updated")
      else toast.error(json.message)
    } catch { toast.error("Failed to update") }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Link href="/matches" className="hover:text-foreground flex items-center gap-1"><ArrowLeft className="h-3.5 w-3.5" /> Matches</Link>
        <span>/</span>
        <span className="text-foreground font-medium">
          {match ? `${match.teamA.shortName} vs ${match.teamB.shortName}` : "..."}
        </span>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Match Pricing</h1>
        <p className="text-muted-foreground">
          {match ? `${match.teamA.shortName} vs ${match.teamB.shortName} at ${match.stadium.name}` : "Loading..."}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-6">
          {/* Existing Pricing */}
          {pricing.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pricing.map((p) => (
                <Card key={p.id} className="group transition-all hover:shadow-md hover:border-primary/30">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-primary/10 p-2"><DollarSign className="h-4 w-4 text-primary" /></div>
                        <div>
                          <p className="font-medium text-sm">{p.categoryName}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.currency === "WIRE" ? "bg-blue-500/10 text-blue-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                            {p.currency}
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(p.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        className="h-8 font-mono"
                        defaultValue={p.price}
                        onBlur={(e) => {
                          if (e.target.value !== p.price) handleUpdate(p.id, e.target.value)
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Add Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Plus className="h-4 w-4" /> Add Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 items-end">
                <div className="space-y-2 flex-1 min-w-[180px]">
                  <Label>Category</Label>
                  <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={newCategoryId} onChange={(e) => setNewCategoryId(e.target.value)}>
                    <option value="">Select category</option>
                    {availableCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2 w-32">
                  <Label>Currency</Label>
                  <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={newCurrency} onChange={(e) => setNewCurrency(e.target.value as "WIRE" | "PSL")}>
                    <option value="WIRE">WIRE</option>
                    <option value="PSL">PSL</option>
                  </select>
                </div>
                <div className="space-y-2 w-40">
                  <Label>Price</Label>
                  <Input value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="0.00" className="font-mono" />
                </div>
                <Button onClick={handleCreate} disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
