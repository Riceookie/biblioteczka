import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET /api/autorzy — lista autorów wraz z LICZBĄ ich książek (zapytanie po relacji
// autor -> książki: "ksiazki(count)").
export async function GET() {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('autorzy')
      .select('id, imie, ksiazki(count)')
      .order('imie', { ascending: true })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// POST /api/autorzy — dodaj autora. WALIDACJA PO STRONIE SERWERA: imię wymagane.
export async function POST(req) {
  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Nieprawidłowy JSON w żądaniu.' }, { status: 400 })
  }

  const imie = String(body.imie ?? '').trim()
  if (!imie) {
    return NextResponse.json({ error: 'Imię autora jest wymagane.' }, { status: 400 })
  }
  if (imie.length > 120) {
    return NextResponse.json({ error: 'Imię autora jest zbyt długie (max 120 znaków).' }, { status: 400 })
  }

  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('autorzy')
      .insert({ imie })
      .select('id, imie, ksiazki(count)')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
