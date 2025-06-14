"use client"

import { useState } from "react"
import { Check, ChevronDown, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useRouter, usePathname } from "next/navigation"

interface Language {
  code: string
  name: string
  flag: string
}

const languages: Language[] = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "sw", name: "Kiswahili", flag: "🇰🇪" },
]

export function LanguageSwitcher() {
  const router = useRouter()
  const pathname = usePathname()

  // Extract current locale from pathname or default to 'en'
  const currentPathSegments = pathname.split("/")
  const currentLocale = languages.find((lang) => currentPathSegments[1] === lang.code)?.code || "en"

  const [selectedLanguage, setSelectedLanguage] = useState<string>(currentLocale)

  const currentLanguage = languages.find((lang) => lang.code === selectedLanguage)

  const handleLanguageChange = (langCode: string) => {
    setSelectedLanguage(langCode)

    // Handle language change in URL
    const newPathSegments = [...currentPathSegments]

    if (languages.some((lang) => lang.code === currentPathSegments[1])) {
      // If current path already has a locale, replace it
      newPathSegments[1] = langCode
    } else {
      // Otherwise, add the locale at the beginning
      newPathSegments.splice(1, 0, langCode)
    }

    const newPath = newPathSegments.join("/")
    router.push(newPath)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-1 px-2">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline-block">
            {currentLanguage?.flag} {currentLanguage?.name}
          </span>
          <span className="inline-block sm:hidden">{currentLanguage?.flag}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            className="flex items-center justify-between cursor-pointer"
            onClick={() => handleLanguageChange(language.code)}
          >
            <span>
              {language.flag} {language.name}
            </span>
            {selectedLanguage === language.code && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
