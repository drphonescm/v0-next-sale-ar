"use client"

import { useState, useEffect } from "react"
import { translations, type Language, type TranslationKey } from "@/lib/i18n"

export function useTranslation() {
  const [language, setLanguage] = useState<Language>("es")

  useEffect(() => {
    const saved = localStorage.getItem("language") as Language | null
    if (saved && (saved === "es" || saved === "en")) {
      setLanguage(saved)
    }

    const handleLanguageChange = (e: CustomEvent<Language>) => {
      setLanguage(e.detail)
    }

    window.addEventListener("languageChange", handleLanguageChange as EventListener)
    return () => {
      window.removeEventListener("languageChange", handleLanguageChange as EventListener)
    }
  }, [])

  const t = (key: TranslationKey): string => {
    return translations[language][key] || key
  }

  return { t, language }
}
