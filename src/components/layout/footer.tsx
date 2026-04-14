import { cn } from "@/lib/utils"
import { BRANDING } from "@/configs/branding"

import { buttonVariants } from "@/components/ui/button"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-background border-t border-sidebar-border">
      <div className="container flex justify-between items-center p-4 md:px-6">
        <p className="text-xs text-muted-foreground md:text-sm">
          © {currentYear}{" "}
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "link" }), "inline p-0")}
          >
            {BRANDING.appName}
          </a>
          .
        </p>
        <p className="text-xs text-muted-foreground md:text-sm">
          Developed by{" "}
          <a
            href="https://ahmedmuneeb.com"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "link" }), "inline p-0")}
          >
            Ahmed Muneeb
          </a>
          .
        </p>
      </div>
    </footer>
  )
}
