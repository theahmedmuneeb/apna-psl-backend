import type { NavigationType } from "@/types"

export const navigationsData: NavigationType[] = [
  {
    title: "Main",
    items: [
      {
        title: "Dashboard",
        href: "/",
        iconName: "LayoutDashboard",
      },
      {
        title: "Teams",
        href: "/teams",
        iconName: "Users",
      },
      {
        title: "Stories",
        href: "/stories",
        iconName: "Newspaper",
      },
    ],
  },
  {
    title: "Ticketing",
    items: [
      {
        title: "Matches",
        href: "/matches",
        iconName: "Trophy",
      },
      {
        title: "Stadiums",
        href: "/stadiums",
        iconName: "Building2",
      },
      {
        title: "Categories",
        href: "/enclosure-categories",
        iconName: "Tag",
      },
    ],
  },
]
