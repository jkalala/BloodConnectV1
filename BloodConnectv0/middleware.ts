import { createI18nMiddleware } from "next-international/middleware"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const I18nMiddleware = createI18nMiddleware({
  locales: ["en", "fr", "sw"],
  defaultLocale: "en",
  urlMappingStrategy: "rewrite",
})

export function middleware(request: NextRequest) {
  return I18nMiddleware(request)
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
} 