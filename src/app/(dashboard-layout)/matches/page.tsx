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
import { Plus, Pencil, Trash2, Loader2, Trophy, Calendar, ArrowRight, Zap } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

type Team = { id: string; name: string; short: string; logo: string | null }
type Stadium = { id: string; name: string; location: string }
type Match = {
  id: string
  sportmonksMatchId: number | null
  startTime: string
  teamA: { id: string; name: string; shortName: string; logoUrl: string | null }
  teamB: { id: string; name: string; shortName: string; logoUrl: string | null }
  stadium: { id: string; name: string; location: string }
}
type Fixture = {
  id: number
  starting_at?: string
  localteam?: { id?: number; name?: string; image_path?: string }
  visitorteam?: { id?: number; name?: string; image_path?: string }
  venue?: { id?: number; name?: string; city?: string }
  status?: string
  round?: string
}

type TabMode = "manual" | "sportmonks"

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [stadiums, setStadiums] = useState<Stadium[]>([])
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [tab, setTab] = useState<TabMode>("sportmonks")
  const [editing, setEditing] = useState<Match | null>(null)
  const [form, setForm] = useState({ teamAId: "", teamBId: "", stadiumId: "", startTime: "", sportmonksMatchId: "" })
  const [submitting, setSubmitting] = useState(false)
  const [loadingFixtures, setLoadingFixtures] = useState(false)

  const fetchMatches = async () => {
    try {
      const [matchRes, teamRes, stadiumRes] = await Promise.all([
        fetch("/api/matches"),
        fetch("/api/teams?includePlaceholders=true"),
        fetch("/api/stadiums"),
      ])
      const [matchJson, teamJson, stadiumJson] = await Promise.all([matchRes.json(), teamRes.json(), stadiumRes.json()])
      if (matchJson.success) setMatches(matchJson.data)
      if (teamJson.success) setTeams(teamJson.data)
      if (stadiumJson.success) setStadiums(stadiumJson.data)
    } catch {
      toast.error("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const fetchFixtures = async () => {
    setLoadingFixtures(true)
    try {
      const res = await fetch("/api/sportmonks/fixtures")
      const json = await res.json()
      if (json.success) setFixtures(json.data ?? [])
      else toast.error("Failed to load fixtures")
    } catch {
      toast.error("Failed to fetch from SportMonks")
    } finally {
      setLoadingFixtures(false)
    }
  }

  useEffect(() => { fetchMatches() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ teamAId: "", teamBId: "", stadiumId: "", startTime: "", sportmonksMatchId: "" })
    setDialogOpen(true)
    if (fixtures.length === 0) fetchFixtures()
  }

  // Convert any date string to a "YYYY-MM-DDTHH:mm" value in PKT for datetime-local inputs
  const toPKTLocal = (d: string) => {
    const date = new Date(d)
    return date.toLocaleString("sv-SE", { timeZone: "Asia/Karachi", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).replace(" ", "T")
  }

  const openEdit = (m: Match) => {
    setEditing(m)
    setForm({
      teamAId: m.teamA.id,
      teamBId: m.teamB.id,
      stadiumId: m.stadium.id,
      startTime: toPKTLocal(m.startTime),
      sportmonksMatchId: m.sportmonksMatchId?.toString() ?? "",
    })
    setTab("manual")
    setDialogOpen(true)
  }

  const selectFixture = (fixture: Fixture) => {
    // Auto map teams and stadium by sportmonks IDs
    const localTeam = teams.find((t) => t.name?.toLowerCase().includes(fixture.localteam?.name?.toLowerCase() ?? "__"))
    const visitorTeam = teams.find((t) => t.name?.toLowerCase().includes(fixture.visitorteam?.name?.toLowerCase() ?? "__"))
    const stadium = stadiums.find((s) => s.name?.toLowerCase().includes(fixture.venue?.name?.toLowerCase() ?? "__"))

    setForm({
      teamAId: localTeam?.id ?? "",
      teamBId: visitorTeam?.id ?? "",
      stadiumId: stadium?.id ?? "",
      startTime: fixture.starting_at ? toPKTLocal(fixture.starting_at) : "",
      sportmonksMatchId: fixture.id.toString(),
    })
    setTab("manual")
    toast.info("Fixture selected. Review and adjust mappings if needed.")
  }

  const handleSubmit = async () => {
    if (!form.teamAId || !form.teamBId || !form.stadiumId || !form.startTime) {
      toast.error("All fields are required"); return
    }
    setSubmitting(true)
    try {
      const body: Record<string, unknown> = {
        teamAId: form.teamAId,
        teamBId: form.teamBId,
        stadiumId: form.stadiumId,
        startTime: form.startTime + ":00+05:00",
      }
      if (!editing && form.sportmonksMatchId) {
        body.sportmonksMatchId = parseInt(form.sportmonksMatchId, 10)
      }
      const url = editing ? `/api/matches/${editing.id}` : "/api/matches"
      const method = editing ? "PATCH" : "POST"
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      const json = await res.json()
      if (json.success) {
        toast.success(editing ? "Match updated" : "Match created")
        setDialogOpen(false)
        fetchMatches()
      } else toast.error(json.message)
    } catch {
      toast.error("Failed to save match")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this match?")) return
    try {
      const res = await fetch(`/api/matches/${id}`, { method: "DELETE" })
      const json = await res.json()
      if (json.success) { toast.success("Match deleted"); fetchMatches() }
      else toast.error(json.message)
    } catch { toast.error("Failed to delete") }
  }

  const formatDate = (d: string) => new Date(d).toLocaleString("en-US", { timeZone: "Asia/Karachi", weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Matches</h1>
          <p className="text-muted-foreground">Manage cricket matches and assign pricing</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Add Match</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Match" : "New Match"}</DialogTitle>
            </DialogHeader>

            {!editing && (
              <div className="flex gap-2 mb-4">
                <Button variant={tab === "sportmonks" ? "default" : "outline"} size="sm" onClick={() => setTab("sportmonks")}>
                  <Zap className="mr-1 h-3.5 w-3.5" /> From SportMonks
                </Button>
                <Button variant={tab === "manual" ? "default" : "outline"} size="sm" onClick={() => setTab("manual")}>
                  Manual Entry
                </Button>
              </div>
            )}

            {tab === "sportmonks" && !editing && (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {loadingFixtures ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                ) : (() => {
                  const now = new Date()
                  const upcoming = fixtures.filter((f) => {
                    if (f.status && f.status.toUpperCase() !== "NS") return false
                    if (!f.starting_at) return false
                    return new Date(f.starting_at).getTime() > now.getTime()
                  })
                  return upcoming.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No upcoming fixtures found</p>
                  ) : (
                    upcoming.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => selectFixture(f)}
                      className="w-full rounded-lg border p-3 text-left hover:border-primary/50 hover:bg-primary/5 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-sm">
                          {f.localteam?.name ?? "TBD"} vs {f.visitorteam?.name ?? "TBD"}
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{f.status ?? "NS"}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{f.venue?.name ?? "—"}</span>
                        <span>·</span>
                        <span>{f.starting_at ? formatDate(f.starting_at) : "—"}</span>
                        <span>·</span>
                        <span className="font-mono">#{f.id}</span>
                      </div>
                    </button>
                  ))
                  )
                })()}
              </div>
            )}

            {(tab === "manual" || editing) && (
              <div className="space-y-4">
                {form.sportmonksMatchId && (
                  <div className="text-xs font-mono text-muted-foreground bg-muted/50 rounded px-3 py-1.5">
                    SportMonks Match ID: {form.sportmonksMatchId}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Team A (Home)</Label>
                    <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.teamAId} onChange={(e) => setForm({ ...form, teamAId: e.target.value })}>
                      <option value="">Select team</option>
                      {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Team B (Away)</Label>
                    <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.teamBId} onChange={(e) => setForm({ ...form, teamBId: e.target.value })}>
                      <option value="">Select team</option>
                      {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Stadium</Label>
                  <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.stadiumId} onChange={(e) => setForm({ ...form, stadiumId: e.target.value })}>
                    <option value="">Select stadium</option>
                    {stadiums.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.location}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input type="datetime-local" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
                </div>
                <Button onClick={handleSubmit} disabled={submitting} className="w-full">
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editing ? "Update" : "Create Match"}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : matches.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No matches yet. Add one from SportMonks or manually.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {matches.map((m) => (
            <Card key={m.id} className="group transition-all hover:shadow-lg hover:border-primary/30">
              <CardContent className="flex items-center justify-between p-4 gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="rounded-lg bg-primary/10 p-2.5 shrink-0">
                    <Trophy className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold truncate">
                      {m.teamA.shortName} vs {m.teamB.shortName}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(m.startTime)}</span>
                      <span>·</span>
                      <span>{m.stadium.name}</span>
                      {m.sportmonksMatchId && (<><span>·</span><span className="font-mono">SM#{m.sportmonksMatchId}</span></>)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/matches/${m.id}/pricing`} className="inline-flex items-center gap-1 text-sm text-primary hover:underline font-medium">
                    Pricing <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(m)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(m.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
