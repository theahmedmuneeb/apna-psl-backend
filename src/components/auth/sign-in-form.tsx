"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import type { SignInFormType } from "@/types"

import { SignInSchema } from "@/schemas/sign-in-schema"

import { supabase } from "@/lib/supabase"

import { toast } from "@/hooks/use-toast"
import { ButtonLoading } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function SignInForm() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const redirectPathname =
    searchParams.get("redirectTo") ||
    process.env.NEXT_PUBLIC_HOME_PATHNAME ||
    "/"

  const form = useForm<SignInFormType>({
    resolver: zodResolver(SignInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const { isSubmitting } = form.formState
  const isDisabled = isSubmitting

  async function onSubmit(data: SignInFormType) {
    const { email, password } = data

    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw new Error(error.message)
      }

      if (!authData.user) {
        throw new Error("Authentication failed. User not found.")
      }

      // Check for admin role in user metadata
      const userMetadata = authData.user.user_metadata as Record<string, unknown>
      const appMetadata = authData.user.app_metadata as Record<string, unknown>

      const hasAdminRole = () => {
        // Check if role field contains "admin"
        const userRole = userMetadata?.role
        const appRole = appMetadata?.role
        
        if (typeof userRole === "string" && userRole.toLowerCase() === "admin") {
          return true
        }
        if (typeof appRole === "string" && appRole.toLowerCase() === "admin") {
          return true
        }

        // Check if roles array contains "admin"
        const userRoles = userMetadata?.roles
        const appRoles = appMetadata?.roles
        
        if (Array.isArray(userRoles) && userRoles.some(r => typeof r === "string" && r.toLowerCase() === "admin")) {
          return true
        }
        if (Array.isArray(appRoles) && appRoles.some(r => typeof r === "string" && r.toLowerCase() === "admin")) {
          return true
        }

        return false
      }

      if (!hasAdminRole()) {
        await supabase.auth.signOut()
        throw new Error("Access denied. Only admin users can sign in to this panel.")
      }

      // Admin verified, show success message and redirect
      toast({
        title: "Welcome Admin",
        description: "You have been signed in successfully.",
      })

      // Small delay to ensure session is saved before redirect
      await new Promise(resolve => setTimeout(resolve, 500))
      
      router.replace(redirectPathname)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sign In Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
      })
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            autoComplete="email"
            aria-invalid={!!form.formState.errors.email}
            {...form.register("email")}
          />
          {form.formState.errors.email && (
            <p className="text-sm text-destructive">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>
        <div className="grid gap-2">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={!!form.formState.errors.password}
            {...form.register("password")}
          />
          {form.formState.errors.password && (
            <p className="text-sm text-destructive">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>
      </div>

      <ButtonLoading isLoading={isSubmitting} disabled={isDisabled}>
        Sign In
      </ButtonLoading>
      <div className="text-sm text-muted-foreground">
        Use an admin Supabase account to access the dashboard.
      </div>
    </form>
  )
}
