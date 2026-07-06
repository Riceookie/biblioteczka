import './globals.css'

export const metadata = {
  title: 'Biblioteczka — Autorzy i Książki',
  description: 'Mini-aplikacja z relacją: Next.js API + Supabase (Postgres). Autor 1—* książki.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  )
}
