"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { GlobeIcon } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function LanguageSwitcher() {
  const [language, setLanguage] = useState<"es" | "en">("es")

  useEffect(() => {
    const saved = localStorage.getItem("language") as "es" | "en" | null
    if (saved) {
      setLanguage(saved)
    }
  }, [])

  const switchLanguage = (lang: "es" | "en") => {
    setLanguage(lang)
    localStorage.setItem("language", lang)
    window.dispatchEvent(new CustomEvent("languageChange", { detail: lang }))
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <GlobeIcon className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => switchLanguage("es")}>
          <span className={language === "es" ? "font-semibold" : ""}>Español</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => switchLanguage("en")}>
          <span className={language === "en" ? "font-semibold" : ""}>English</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
