"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import type { teams } from "@/db/schema"
import { ButtonLoading } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type TeamRow = typeof teams.$inferSelect
type TeamActionResult = {
  success: boolean
  message: string
}

type TeamFormValues = {
  name: string
  shortName: string
  sportmonksTeamId: number
  logoFile: FileList
}

type TeamsClientProps = {
  teamsList: TeamRow[]
  supabaseBaseUrl: string
  logosBucket: string
  createTeamAction: (formData: FormData) => Promise<TeamActionResult>
  updateTeamAction: (formData: FormData) => Promise<TeamActionResult>
  deleteTeamAction: (formData: FormData) => Promise<TeamActionResult>
}

export function TeamsClient({
  teamsList,
  supabaseBaseUrl,
  logosBucket,
  createTeamAction,
  updateTeamAction,
  deleteTeamAction,
}: TeamsClientProps) {
  const router = useRouter()
  const [isSubmitting, startSubmitTransition] = useTransition()
  const [isDeleting, startDeleteTransition] = useTransition()
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
    },
  })

  useEffect(() => {
    reset({
      name: editingTeam?.name ?? "",
      shortName: editingTeam?.shortName ?? "",
      sportmonksTeamId: editingTeam?.sportmonksTeamId,
    })
  }, [editingTeam, reset])

  const getLogoUrl = (logoPath: string | null) => {
    if (!logoPath) return null
    return `${supabaseBaseUrl}/storage/v1/object/public/${logosBucket}/${logoPath}`
  }

  const handleCreateOrUpdateSubmit = (values: TeamFormValues) => {
    const formData = new FormData()
    formData.set("name", values.name)
    formData.set("shortName", values.shortName)
    formData.set("sportmonksTeamId", String(values.sportmonksTeamId))

    const logo = values.logoFile?.[0]
    if (logo) {
      formData.set("logoFile", logo)
    }

    if (editingTeam) {
      formData.set("teamId", editingTeam.id)
    }

    startSubmitTransition(async () => {
      const result = editingTeam
        ? await updateTeamAction(formData)
        : await createTeamAction(formData)

      if (!result.success) {
        toast.error(result.message)
        return
      }

      toast.success(result.message)
      reset({
        name: "",
        shortName: "",
        sportmonksTeamId: undefined,
      })
      setEditingTeam(null)
      router.refresh()
    })
  }

  const handleStartEdit = (team: TeamRow) => {
    setEditingTeam(team)
  }

  const handleCancelEdit = () => {
    setEditingTeam(null)
    reset({
      name: "",
      shortName: "",
      sportmonksTeamId: undefined,
    })
  }

  const handleDelete = (teamId: string) => {
    setDeletingTeamId(teamId)

    startDeleteTransition(async () => {
      const formData = new FormData()
      formData.set("teamId", teamId)

      const result = await deleteTeamAction(formData)

      if (!result.success) {
        toast.error(result.message)
        setDeletingTeamId(null)
        return
      }

      toast.success(result.message)
      setDeletingTeamId(null)
      router.refresh()
    })
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
              Team Logo
            </label>
            <Input id="logoFile" type="file" accept="image/*" {...register("logoFile")} />
            <p className="text-xs text-muted-foreground">
              {editingTeam
                ? "Upload a new logo only if you want to replace the existing one."
                : "Upload an image. It will be stored in Supabase Storage and the path will be saved in the database."}
            </p>
          </div>

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
                        {getLogoUrl(team.logoUrl) ? (
                          <div className="relative h-10 w-10 overflow-hidden rounded-full border bg-muted">
                            <img
                              src={getLogoUrl(team.logoUrl)!}
                              alt={team.name}
                              className="h-full w-full object-contain p-1"
                            />
                          </div>
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full border bg-muted text-xs font-semibold">
                            {team.shortName}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium">{team.name}</td>
                      <td className="px-4 py-3">{team.shortName}</td>
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
