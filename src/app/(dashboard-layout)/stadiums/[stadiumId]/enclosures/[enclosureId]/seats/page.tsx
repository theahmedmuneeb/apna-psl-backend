"use client"

import { useEffect, useState, useCallback } from "react"
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
import { Plus, Loader2, ArrowLeft, Save, ToggleLeft, ToggleRight, Armchair } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

type Seat = {
  id: string
  enclosureId: string
  rowLabel: string
  seatNumber: number
  label: string
  isActive: boolean
}

type Enclosure = { id: string; name: string; stadiumId: string }

type EditableSeat = Seat & { dirty?: boolean }

export default function SeatsPage() {
  const params = useParams()
  const stadiumId = params.stadiumId as string
  const enclosureId = params.enclosureId as string

  const [seats, setSeats] = useState<EditableSeat[]>([])
  const [enclosure, setEnclosure] = useState<Enclosure | null>(null)
  const [loading, setLoading] = useState(true)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkForm, setBulkForm] = useState({ rowStart: "A", rowEnd: "F", seatsPerRow: "10" })
  const [submitting, setSubmitting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const fetchData = async () => {
    try {
      const [seatRes, encRes] = await Promise.all([
        fetch(`/api/seats?enclosureId=${enclosureId}`),
        fetch(`/api/enclosures/${enclosureId}`),
      ])
      const [seatJson, encJson] = await Promise.all([seatRes.json(), encRes.json()])
      if (seatJson.success) setSeats(seatJson.data.map((s: Seat) => ({ ...s, dirty: false })))
      if (encJson.success) setEnclosure(encJson.data)
    } catch {
      toast.error("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [enclosureId])

  // Group seats by row
  const rowGroups = seats.reduce<Record<string, EditableSeat[]>>((acc, seat) => {
    if (!acc[seat.rowLabel]) acc[seat.rowLabel] = []
    acc[seat.rowLabel].push(seat)
    return acc
  }, {})

  const sortedRows = Object.entries(rowGroups).sort(([a], [b]) => a.localeCompare(b))

  // Generate alphabet range
  const generateRows = (start: string, end: string) => {
    const rows: string[] = []
    const startCode = start.toUpperCase().charCodeAt(0)
    const endCode = end.toUpperCase().charCodeAt(0)
    for (let i = startCode; i <= endCode; i++) {
      rows.push(String.fromCharCode(i))
    }
    return rows
  }

  const handleBulkCreate = async () => {
    const rows = generateRows(bulkForm.rowStart, bulkForm.rowEnd)
    const seatsPerRow = parseInt(bulkForm.seatsPerRow, 10)
    if (rows.length === 0 || isNaN(seatsPerRow) || seatsPerRow < 1) {
      toast.error("Invalid row/seat configuration")
      return
    }
    setSubmitting(true)
    try {
      const body = {
        enclosureId,
        rows: rows.map((rowLabel) => ({
          rowLabel,
          seats: Array.from({ length: seatsPerRow }, (_, i) => ({
            seatNumber: i + 1,
            label: `${rowLabel}${i + 1}`,
          })),
        })),
      }
      const res = await fetch("/api/seats/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(`Created ${json.data.length} seats`)
        setBulkOpen(false)
        fetchData()
      } else {
        toast.error(json.message)
      }
    } catch {
      toast.error("Failed to create seats")
    } finally {
      setSubmitting(false)
    }
  }

  const updateSeatLocal = (seatId: string, field: keyof EditableSeat, value: string | number | boolean) => {
    setSeats((prev) =>
      prev.map((s) =>
        s.id === seatId ? { ...s, [field]: value, dirty: true } : s
      )
    )
    setHasChanges(true)
  }

  const toggleSeatActive = (seatId: string) => {
    setSeats((prev) =>
      prev.map((s) =>
        s.id === seatId ? { ...s, isActive: !s.isActive, dirty: true } : s
      )
    )
    setHasChanges(true)
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      // Build rows from current state
      const groupedRows = new Map<string, { seatNumber: number; label: string }[]>()
      for (const seat of seats) {
        if (!seat.isActive) continue // only include active seats in sync
        if (!groupedRows.has(seat.rowLabel)) groupedRows.set(seat.rowLabel, [])
        groupedRows.get(seat.rowLabel)!.push({ seatNumber: seat.seatNumber, label: seat.label })
      }

      const rows = Array.from(groupedRows.entries()).map(([rowLabel, seatList]) => ({
        rowLabel,
        seats: seatList.sort((a, b) => a.seatNumber - b.seatNumber),
      }))

      const res = await fetch("/api/seats/sync", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enclosureId, rows }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success("Seats synced successfully")
        setSeats(json.data.map((s: Seat) => ({ ...s, dirty: false })))
        setHasChanges(false)
      } else {
        toast.error(json.message)
      }
    } catch {
      toast.error("Sync failed")
    } finally {
      setSyncing(false)
    }
  }

  const activeCount = seats.filter((s) => s.isActive).length
  const inactiveCount = seats.filter((s) => !s.isActive).length

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Link href="/stadiums" className="hover:text-foreground flex items-center gap-1"><ArrowLeft className="h-3.5 w-3.5" /> Stadiums</Link>
        <span>/</span>
        <Link href={`/stadiums/${stadiumId}/enclosures`} className="hover:text-foreground">Enclosures</Link>
        <span>/</span>
        <span className="text-foreground font-medium">{enclosure?.name ?? "..."}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Seat Editor</h1>
          <p className="text-muted-foreground">
            {seats.length > 0
              ? `${activeCount} active · ${inactiveCount} inactive · ${sortedRows.length} rows`
              : "No seats configured yet"}
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => setBulkOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Bulk Create
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bulk Create Seats</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Row Start</Label>
                    <Input value={bulkForm.rowStart} onChange={(e) => setBulkForm({ ...bulkForm, rowStart: e.target.value })} placeholder="A" maxLength={3} />
                  </div>
                  <div className="space-y-2">
                    <Label>Row End</Label>
                    <Input value={bulkForm.rowEnd} onChange={(e) => setBulkForm({ ...bulkForm, rowEnd: e.target.value })} placeholder="F" maxLength={3} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Seats per Row</Label>
                  <Input type="number" value={bulkForm.seatsPerRow} onChange={(e) => setBulkForm({ ...bulkForm, seatsPerRow: e.target.value })} placeholder="10" />
                </div>
                <p className="text-xs text-muted-foreground">
                  This will create {generateRows(bulkForm.rowStart, bulkForm.rowEnd).length} rows × {bulkForm.seatsPerRow} seats = {generateRows(bulkForm.rowStart, bulkForm.rowEnd).length * parseInt(bulkForm.seatsPerRow || "0", 10)} total seats
                </p>
                <Button onClick={handleBulkCreate} disabled={submitting} className="w-full">
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Seats
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {hasChanges && (
            <Button onClick={handleSync} disabled={syncing} className="bg-emerald-600 hover:bg-emerald-700">
              {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          )}
        </div>
      </div>

      {/* Seat Grid */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : seats.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center space-y-4">
            <Armchair className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <div>
              <p className="text-muted-foreground text-lg font-medium">No seats configured</p>
              <p className="text-muted-foreground text-sm">Use &quot;Bulk Create&quot; to generate a seat layout</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Stage / Screen indicator */}
          <div className="text-center">
            <div className="inline-block px-12 py-2 rounded-b-xl bg-gradient-to-b from-primary/20 to-primary/5 border border-t-0 border-primary/20 text-xs font-semibold text-muted-foreground tracking-widest uppercase">
              Stage / Pitch View
            </div>
          </div>

          {/* Seat rows */}
          <div className="space-y-2">
            {sortedRows.map(([rowLabel, rowSeats]) => {
              const sorted = [...rowSeats].sort((a, b) => a.seatNumber - b.seatNumber)
              return (
                <div key={rowLabel} className="flex items-center gap-3">
                  <div className="w-12 text-right text-sm font-semibold text-muted-foreground shrink-0">
                    {rowLabel}
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {sorted.map((seat) => (
                      <button
                        key={seat.id}
                        onClick={() => toggleSeatActive(seat.id)}
                        title={`${seat.label} — Click to ${seat.isActive ? "deactivate" : "activate"}`}
                        className={`
                          w-10 h-10 rounded-md text-xs font-medium transition-all duration-150 border
                          ${seat.isActive
                            ? seat.dirty
                              ? "bg-amber-500/20 border-amber-500/50 text-amber-200 hover:bg-amber-500/30"
                              : "bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25"
                            : "bg-muted/30 border-muted text-muted-foreground/40 hover:bg-muted/50 line-through"
                          }
                        `}
                      >
                        {seat.label}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex gap-6 justify-center pt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-emerald-500/15 border border-emerald-500/30" />
              Active
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-amber-500/20 border border-amber-500/50" />
              Modified
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-muted/30 border border-muted" />
              Inactive
            </div>
          </div>

          {/* Inline Edit Table */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Inline Seat Editor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 px-2 font-medium">Row</th>
                      <th className="py-2 px-2 font-medium">Seat #</th>
                      <th className="py-2 px-2 font-medium">Label</th>
                      <th className="py-2 px-2 font-medium text-center">Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seats.slice(0, 100).map((seat) => (
                      <tr key={seat.id} className={`border-b last:border-0 ${seat.dirty ? "bg-amber-500/5" : ""}`}>
                        <td className="py-1.5 px-2">
                          <Input
                            className="h-8 w-20"
                            value={seat.rowLabel}
                            onChange={(e) => updateSeatLocal(seat.id, "rowLabel", e.target.value)}
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <Input
                            className="h-8 w-20"
                            type="number"
                            value={seat.seatNumber}
                            onChange={(e) => updateSeatLocal(seat.id, "seatNumber", parseInt(e.target.value, 10) || 0)}
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <Input
                            className="h-8 w-28"
                            value={seat.label}
                            onChange={(e) => updateSeatLocal(seat.id, "label", e.target.value)}
                          />
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          <button onClick={() => toggleSeatActive(seat.id)} className="text-muted-foreground hover:text-foreground">
                            {seat.isActive ? <ToggleRight className="h-5 w-5 text-emerald-500" /> : <ToggleLeft className="h-5 w-5" />}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {seats.length > 100 && (
                  <p className="text-xs text-muted-foreground text-center py-2">Showing first 100 seats. Use the visual grid above for full view.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
