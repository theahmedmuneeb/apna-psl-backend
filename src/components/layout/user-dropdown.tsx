"use client"

import { useEffect, useState } from "react"
import { LogOut } from "lucide-react"

import { supabase } from "@/lib/supabase"
import { getInitials } from "@/lib/utils"

import { toast } from "@/hooks/use-toast"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type DisplayUser = {
  name: string
  email: string
  avatarUrl: string | null
}

const FALLBACK_USER: DisplayUser = {
  name: "User",
  email: "",
  avatarUrl: null,
}

function mapSupabaseUser(user: {
  email?: string | null
  user_metadata?: Record<string, unknown> | null
}): DisplayUser {
  const metadata = (user.user_metadata || {}) as Record<string, unknown>
  const firstName =
    typeof metadata.first_name === "string" ? metadata.first_name.trim() : ""
  const lastName =
    typeof metadata.last_name === "string" ? metadata.last_name.trim() : ""

  const fullNameFromParts = `${firstName} ${lastName}`.trim()
  const fullName =
    (typeof metadata.full_name === "string" && metadata.full_name.trim()) ||
    (typeof metadata.name === "string" && metadata.name.trim()) ||
    fullNameFromParts ||
    (user.email ? user.email.split("@")[0] : "") ||
    FALLBACK_USER.name

  const avatarUrl =
    (typeof metadata.avatar_url === "string" && metadata.avatar_url) ||
    (typeof metadata.picture === "string" && metadata.picture) ||
    null

  return {
    name: fullName,
    email: user.email || "",
    avatarUrl,
  }
}

export function UserDropdown() {
  const [displayUser, setDisplayUser] = useState<DisplayUser>(FALLBACK_USER)

  useEffect(() => {
    let isMounted = true

    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!isMounted || !user) return
      setDisplayUser(mapSupabaseUser(user))
    }

    loadUser()

    return () => {
      isMounted = false
    }
  }, [])

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign Out Failed",
        description: error.message,
      })
      return
    }

    window.location.replace("/sign-in")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="rounded-lg"
          aria-label="User"
        >
          <Avatar className="size-9">
            <AvatarImage src={displayUser.avatarUrl || undefined} alt="" />
            <AvatarFallback className="bg-transparent">
              {getInitials(displayUser.name)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent forceMount>
        <DropdownMenuLabel className="flex gap-2">
          <Avatar>
            <AvatarImage src={displayUser.avatarUrl || undefined} alt="Avatar" />
            <AvatarFallback className="bg-transparent">
              {getInitials(displayUser.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <p className="text-sm font-medium truncate">{displayUser.name}</p>
            <p className="text-xs text-muted-foreground font-semibold truncate">
              {displayUser.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="me-2 size-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
