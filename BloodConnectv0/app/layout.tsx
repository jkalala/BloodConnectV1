import ClientLayout from "./client-layout"
import { metadata } from "./metadata"
import "./globals.css"

interface RootLayoutProps {
  children: React.ReactNode
  params: { locale: string }
}

export { metadata }

export default function RootLayout({
  children,
  params: { locale }
}: RootLayoutProps) {
  return (
    <html lang={locale} suppressHydrationWarning>
      <head />
      <body suppressHydrationWarning>
        <ClientLayout locale={locale}>
          {children}
        </ClientLayout>
      </body>
    </html>
  )
}
