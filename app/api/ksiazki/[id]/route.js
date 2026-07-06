import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// DELETE /api/ksiazki/:id — usuń pojedynczą książkę.
export async function DELETE(_req, { params }) {
  try {
    const supabase = getSupabase()
    const { error } = await supabase.from('ksiazki').delete().eq('id', params.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
