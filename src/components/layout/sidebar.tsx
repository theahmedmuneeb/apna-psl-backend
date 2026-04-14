"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown } from "lucide-react"

import { useSettings } from "@/hooks/use-settings"
import type { NavigationNestedItem, NavigationRootItem } from "@/types"

import { BRANDING } from "@/configs/branding"
import { navigationsData } from "@/data/navigations"

import { isActivePathname } from "@/lib/utils"

import { Badge } from "@/components/ui/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  Sidebar as SidebarWrapper,
  useSidebar,
} from "@/components/ui/sidebar"
import { DynamicIcon } from "@/components/dynamic-icon"
import { ScrollArea } from "@/components/ui/scroll-area"

export function Sidebar() {
  const pathname = usePathname()
  const { openMobile, setOpenMobile, isMobile } = useSidebar()
  const { settings } = useSettings()

  const isHoizontalAndDesktop = settings.layout === "horizontal" && !isMobile

  // If the layout is horizontal and not on mobile, don't render the sidebar. (We use a menubar for horizontal layout navigation.)
  if (isHoizontalAndDesktop) return null

  const renderMenuItem = (item: NavigationRootItem | NavigationNestedItem) => {
    if (item.items) {
      return null
    }

    if ("href" in item) {
      const isActive = isActivePathname(item.href, pathname)

      return (
        <SidebarMenuButton
          isActive={isActive}
          onClick={() => setOpenMobile(!openMobile)}
          asChild
        >
          <Link href={item.href}>
            {"iconName" in item && (
              <DynamicIcon name={item.iconName} className="h-4 w-4" />
            )}
            <span>{item.title}</span>
            {"label" in item && <Badge variant="secondary">{item.label}</Badge>}
          </Link>
        </SidebarMenuButton>
      )
    }

    return null
  }

  return (
    <SidebarWrapper side="left">
      <SidebarHeader>
        <Link
          href="/"
          className="w-fit flex text-foreground font-black p-2 pb-0 mb-2"
          onClick={() => isMobile && setOpenMobile(!openMobile)}
        >
          <Image
            src={BRANDING.logoSrc}
            alt={BRANDING.appName}
            height={24}
            width={24}
            className="dark:invert"
          />
          <span>{BRANDING.appName}</span>
        </Link>
      </SidebarHeader>
      <ScrollArea>
        <SidebarContent className="gap-0">
          {navigationsData.map((nav) => (
            <SidebarGroup key={nav.title}>
              <SidebarGroupLabel>{nav.title}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {nav.items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      {renderMenuItem(item)}
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
      </ScrollArea>
    </SidebarWrapper>
  )
}
