import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET /api/ksiazki?autor_id=... — książki danego autora (filtr po kluczu obcym).
export async function GET(req) {
  const autorId = new URL(req.url).searchParams.get('autor_id')
  if (!autorId) {
    return NextResponse.json({ error: 'Wymagany parametr autor_id.' }, { status: 400 })
  }
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('ksiazki')
      .select('id, tytul, rok, autor_id')
      .eq('autor_id', autorId)
      .order('rok', { ascending: true })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// POST /api/ksiazki — dodaj książkę do autora.
// WALIDACJA PO STRONIE SERWERA: tytuł wymagany, autor_id wymagany, rok sensowny.
export async function POST(req) {
  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Nieprawidłowy JSON w żądaniu.' }, { status: 400 })
  }

  const tytul = String(body.tytul ?? '').trim()
  const autorId = String(body.autor_id ?? '').trim()

  if (!autorId) {
    return NextResponse.json({ error: 'Brak autora (autor_id).' }, { status: 400 })
  }
  if (!tytul) {
    return NextResponse.json({ error: 'Tytuł książki jest wymagany.' }, { status: 400 })
  }
  if (tytul.length > 200) {
    return NextResponse.json({ error: 'Tytuł jest zbyt długi (max 200 znaków).' }, { status: 400 })
  }

  // Rok jest opcjonalny, ale jeśli podany — musi być liczbą w sensownym zakresie.
  let rok = null
  if (body.rok !== null && body.rok !== undefined && String(body.rok).trim() !== '') {
    rok = Number(body.rok)
    if (!Number.isInteger(rok) || rok < 0 || rok > 2100) {
      return NextResponse.json({ error: 'Rok musi być liczbą całkowitą z zakresu 0–2100.' }, { status: 400 })
    }
  }

  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('ksiazki')
      .insert({ autor_id: autorId, tytul, rok })
      .select('id, tytul, rok, autor_id')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
