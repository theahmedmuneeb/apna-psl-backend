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
]
