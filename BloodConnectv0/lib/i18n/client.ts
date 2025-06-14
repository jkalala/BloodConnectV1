import { createI18nClient } from "next-international/client"

export const { useI18n, useScopedI18n, I18nProviderClient, useChangeLocale, useCurrentLocale, useTranslation } =
  createI18nClient({
    en: () => import("./locales/en"),
    fr: () => import("./locales/fr"),
    sw: () => import("./locales/sw"),
  })
