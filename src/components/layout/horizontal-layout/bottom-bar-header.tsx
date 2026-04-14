"use client"

import Image from "next/image"
import Link from "next/link"

import { BRANDING } from "@/configs/branding"
import { FullscreenToggle } from "@/components/layout/full-screen-toggle"
import { ModeDropdown } from "@/components/layout/mode-dropdown"
import { UserDropdown } from "@/components/layout/user-dropdown"
import { ToggleMobileSidebar } from "../toggle-mobile-sidebar"

export function BottomBarHeader() {
  return (
    <div className="container flex h-14 justify-between items-center gap-4">
      <ToggleMobileSidebar />
      <Link href="/" className="hidden text-foreground font-black lg:flex">
        <Image
          src={BRANDING.logoSrc}
          alt={BRANDING.appName}
          height={24}
          width={24}
          className="dark:invert"
        />
        <span>{BRANDING.appName}</span>
      </Link>
      <div className="flex gap-2">
        <FullscreenToggle />
        <ModeDropdown />
        <UserDropdown />
      </div>
    </div>
  )
}
