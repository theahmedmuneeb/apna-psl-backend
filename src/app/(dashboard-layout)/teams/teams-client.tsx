"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { ButtonLoading } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type TeamRow = {
  id: string
  name: string
  short: string
  sportmonksTeamId: number
  logo: string | null
  isPlaceholder: boolean
}

type TeamFormValues = {
  name: string
  shortName: string
  sportmonksTeamId: number
  logoFile: FileList
  isPlaceholder: boolean
}

export function TeamsClient() {
  const router = useRouter()
  const [teamsList, setTeamsList] = useState<TeamRow[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deletingTeamId, setDeletingTeamId] = useState<string | null>(null)
  const [editingTeam, setEditingTeam] = useState<TeamRow | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TeamFormValues>({
    defaultValues: {
      name: "",
      shortName: "",
      sportmonksTeamId: undefined,
      isPlaceholder: false,
    },
  })

  const fetchTeams = async () => {
    try {
      const res = await fetch("/api/teams?includePlaceholders=true")
      const json = await res.json()
      if (json.success) setTeamsList(json.data)
    } catch {
      toast.error("Failed to load teams")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeams()
  }, [])

  useEffect(() => {
    reset({
      name: editingTeam?.name ?? "",
      shortName: editingTeam?.short ?? "",
      sportmonksTeamId: editingTeam?.sportmonksTeamId,
      isPlaceholder: editingTeam?.isPlaceholder ?? false,
    })
  }, [editingTeam, reset])

  const getLogoUrl = (logoPath: string | null) => {
    if (!logoPath) return null
    if (/^https?:\/\//i.test(logoPath)) return logoPath
    return `/api/teams/logo?path=${encodeURIComponent(logoPath)}`
  }

  const handleCreateOrUpdateSubmit = async (values: TeamFormValues) => {
    const formData = new FormData()
    formData.set("name", values.name)
    formData.set("shortName", values.shortName)
    formData.set("sportmonksTeamId", String(values.sportmonksTeamId))
    formData.set("isPlaceholder", String(values.isPlaceholder))

    const logo = values.logoFile?.[0]
    if (logo) {
      formData.set("logoFile", logo)
    }

    setIsSubmitting(true)
    try {
      const url = editingTeam ? `/api/teams/${editingTeam.id}` : "/api/teams"
      const method = editingTeam ? "PATCH" : "POST"
      const res = await fetch(url, { method, body: formData })
      const json = await res.json()

      if (!json.success) {
        toast.error(json.message)
        return
      }

      toast.success(json.message)
      reset({ name: "", shortName: "", sportmonksTeamId: undefined, isPlaceholder: false })
      setEditingTeam(null)
      fetchTeams()
    } catch {
      toast.error("Failed to save team")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStartEdit = (team: TeamRow) => {
    setEditingTeam(team)
  }

  const handleCancelEdit = () => {
    setEditingTeam(null)
    reset({ name: "", shortName: "", sportmonksTeamId: undefined, isPlaceholder: false })
  }

  const handleDelete = async (teamId: string) => {
    setDeletingTeamId(teamId)
    setIsDeleting(true)

    try {
      const res = await fetch(`/api/teams/${teamId}`, { method: "DELETE" })
      const json = await res.json()

      if (!json.success) {
        toast.error(json.message)
        return
      }

      toast.success(json.message)
      fetchTeams()
    } catch {
      toast.error("Failed to delete team")
    } finally {
      setDeletingTeamId(null)
      setIsDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="container py-6">
        <p className="text-muted-foreground">Loading teams...</p>
      </div>
    )
  }

  return (
    <div className="container py-6 space-y-6">
      <section className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Teams</h1>
        <p className="text-muted-foreground">
          Add, view, and remove PSL teams from one place.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <form
          onSubmit={handleSubmit(handleCreateOrUpdateSubmit)}
          className="space-y-4 rounded-xl border bg-card p-5 shadow-sm"
        >
          <div className="space-y-2">
            <h2 className="text-lg font-medium">
              {editingTeam ? "Edit Team" : "Add Team"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {editingTeam
                ? "Update team details for the admin panel."
                : "Create a new team entry for the admin panel."}
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Team Name
            </label>
            <Input
              id="name"
              placeholder="Islamabad United"
              {...register("name", {
                required: "Team name is required",
              })}
            />
            {errors.name ? (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="shortName" className="text-sm font-medium">
              Short Name
            </label>
            <Input
              id="shortName"
              placeholder="IU"
              maxLength={5}
              {...register("shortName", {
                required: "Short name is required",
              })}
            />
            {errors.shortName ? (
              <p className="text-xs text-destructive">{errors.shortName.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="sportmonksTeamId" className="text-sm font-medium">
              Sportmonks Team ID
            </label>
            <Input
              id="sportmonksTeamId"
              type="number"
              min={0}
              placeholder="e.g. 123"
              {...register("sportmonksTeamId", {
                required: "Sportmonks Team ID is required",
                valueAsNumber: true,
                min: {
                  value: 0,
                  message: "Sportmonks Team ID cannot be negative",
                },
              })}
            />
            {errors.sportmonksTeamId ? (
              <p className="text-xs text-destructive">{errors.sportmonksTeamId.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="logoFile" className="text-sm font-medium">
              Team Logo (optional)
            </label>
            <Input id="logoFile" type="file" accept="image/*" {...register("logoFile")} />
            <p className="text-xs text-muted-foreground">
              {editingTeam
                ? "Upload a new logo only if you want to replace the existing one."
                : "Upload an image for the team logo. Optional for placeholder teams."}
            </p>
          </div>

          <label className="inline-flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              {...register("isPlaceholder")}
            />
            Placeholder team (e.g. TBC)
          </label>

          <ButtonLoading isLoading={isSubmitting} disabled={isSubmitting} className="w-full">
            {editingTeam ? "Save Changes" : "Add Team"}
          </ButtonLoading>

          {editingTeam ? (
            <ButtonLoading
              type="button"
              variant="outline"
              isLoading={false}
              className="w-full"
              disabled={isSubmitting}
              onClick={handleCancelEdit}
            >
              Cancel Edit
            </ButtonLoading>
          ) : null}
        </form>

        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="border-b p-5">
            <h2 className="text-lg font-medium">Manage Teams</h2>
            <p className="text-sm text-muted-foreground">
              Current teams in the database.
            </p>
          </div>

          {teamsList.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">No teams found yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Logo</th>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Short</th>
                    <th className="px-4 py-3 font-medium">Sportmonks ID</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teamsList.map((team) => (
                    <tr key={team.id} className="border-b last:border-b-0">
                      <td className="px-4 py-3">
                        {team.logo ? (
                          <div className="relative h-10 w-10 overflow-hidden rounded-full border bg-muted">
                            <img
                              src={team.logo}
                              alt={team.name}
                              className="h-full w-full object-contain p-1"
                            />
                          </div>
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full border bg-muted text-xs font-semibold">
                            {team.short}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium">{team.name}</td>
                      <td className="px-4 py-3">{team.short}</td>
                      <td className="px-4 py-3">{team.sportmonksTeamId}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <ButtonLoading
                            type="button"
                            variant="outline"
                            size="sm"
                            isLoading={false}
                            disabled={isSubmitting || isDeleting}
                            onClick={() => handleStartEdit(team)}
                          >
                            Edit
                          </ButtonLoading>

                          <ButtonLoading
                            type="button"
                            variant="destructive"
                            size="sm"
                            isLoading={isDeleting && deletingTeamId === team.id}
                            disabled={isSubmitting || isDeleting}
                            onClick={() => handleDelete(team.id)}
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
        </div>
      </section>
    </div>
  )
}
