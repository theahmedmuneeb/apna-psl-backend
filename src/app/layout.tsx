import { Lato } from "next/font/google"

import { cn } from "@/lib/utils"

import "./globals.css"

import { Providers } from "@/providers"

import type { Metadata } from "next"
import type { ReactNode } from "react"

import { Toaster as Sonner } from "@/components/ui/sonner"
import { Toaster } from "@/components/ui/toaster"
import { BRANDING } from "../configs/branding"

// Define metadata for the application
// More info: https://nextjs.org/docs/app/building-your-application/optimizing/metadata
export const metadata: Metadata = {
  title: {
    template: `%s | ${BRANDING.appName}`,
    default: BRANDING.appName,
  },
  description: "",
  metadataBase: new URL(process.env.BASE_URL as string),
}

// Define fonts for the application
// More info: https://nextjs.org/docs/app/building-your-application/optimizing/fonts
const latoFont = Lato({
  subsets: ["latin"],
  weight: ["100", "300", "400", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-lato",
})
export default function RootLayout(props: { children: ReactNode }) {
  const { children } = props

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "font-lato bg-background text-foreground antialiased overscroll-none",
          latoFont.variable
        )}
      >
        <Providers>
          {children}
          <Toaster />
          <Sonner />
        </Providers>
      </body>
    </html>
  )
}
