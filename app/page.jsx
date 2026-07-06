'use client'

import { useEffect, useState } from 'react'

// Helper: wywołanie NASZEGO API (nie bazy wprost). Rzuca błędem z komunikatem
// serwera (m.in. z walidacji), gdy odpowiedź nie jest OK.
async function api(path, options) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Błąd ${res.status}`)
  return data
}

export default function Home() {
  const [authors, setAuthors] = useState([])
  const [selected, setSelected] = useState(null) // wybrany autor
  const [books, setBooks] = useState([])

  const [loadingAuthors, setLoadingAuthors] = useState(true)
  const [loadingBooks, setLoadingBooks] = useState(false)
  const [error, setError] = useState(null)

  const [authorName, setAuthorName] = useState('')
  const [bookTitle, setBookTitle] = useState('')
  const [bookYear, setBookYear] = useState('')

  const countOf = (a) => a.ksiazki?.[0]?.count ?? 0

  async function loadAuthors() {
    setLoadingAuthors(true); setError(null)
    try {
      setAuthors(await api('/api/autorzy'))
    } catch (e) { setError(e.message) } finally { setLoadingAuthors(false) }
  }

  async function loadBooks(autorId) {
    setLoadingBooks(true); setError(null)
    try {
      setBooks(await api(`/api/ksiazki?autor_id=${autorId}`))
    } catch (e) { setError(e.message) } finally { setLoadingBooks(false) }
  }

  useEffect(() => { loadAuthors() }, [])
  useEffect(() => {
    if (selected) loadBooks(selected.id)
    else setBooks([])
  }, [selected])

  // Lokalna korekta licznika książek przy autorze (bez ponownego zapytania).
  function bumpCount(autorId, delta) {
    setAuthors((prev) => prev.map((a) =>
      a.id === autorId ? { ...a, ksiazki: [{ count: countOf(a) + delta }] } : a))
  }

  async function addAuthor(e) {
    e.preventDefault(); setError(null)
    try {
      const created = await api('/api/autorzy', {
        method: 'POST', body: JSON.stringify({ imie: authorName }),
      })
      setAuthorName('')
      setAuthors((prev) => [...prev, created].sort((a, b) => a.imie.localeCompare(b.imie, 'pl')))
    } catch (e) { setError(e.message) }
  }

  async function addBook(e) {
    e.preventDefault(); if (!selected) return; setError(null)
    try {
      const created = await api('/api/ksiazki', {
        method: 'POST',
        body: JSON.stringify({ autor_id: selected.id, tytul: bookTitle, rok: bookYear }),
      })
      setBookTitle(''); setBookYear('')
      setBooks((prev) => [...prev, created])
      bumpCount(selected.id, +1)
    } catch (e) { setError(e.message) }
  }

  async function removeBook(id) {
    setError(null)
    try {
      await api(`/api/ksiazki/${id}`, { method: 'DELETE' })
      setBooks((prev) => prev.filter((b) => b.id !== id))
      bumpCount(selected.id, -1)
    } catch (e) { setError(e.message) }
  }

  async function removeAuthor(author) {
    if (!confirm(`Usunąć autora „${author.imie}" wraz z jego książkami?`)) return
    setError(null)
    try {
      await api(`/api/autorzy/${author.id}`, { method: 'DELETE' })
      setAuthors((prev) => prev.filter((a) => a.id !== author.id))
      if (selected?.id === author.id) setSelected(null)
    } catch (e) { setError(e.message) }
  }

  return (
    <main className="wrap">
      <header className="head">
        <h1>📚 Biblioteczka</h1>
        <p className="muted">
          Relacja <b>jeden do wielu</b> na prawdziwym backendzie:{' '}
          <strong>Next.js API</strong> + <strong>Supabase (Postgres)</strong>.
          Jeden autor — wiele książek. Walidacja dzieje się na serwerze.
        </p>
      </header>

      {error && <div className="banner error">⚠️ {error}</div>}

      <div className="cols">
        {/* AUTORZY */}
        <section className="panel">
          <h2>Autorzy</h2>
          <form className="row" onSubmit={addAuthor}>
            <input className="input" placeholder="Imię i nazwisko autora"
              value={authorName} onChange={(e) => setAuthorName(e.target.value)} />
            <button className="btn">Dodaj</button>
          </form>

          {loadingAuthors ? (
            <p className="muted">Ładowanie…</p>
          ) : authors.length === 0 ? (
            <p className="muted">Brak autorów — dodaj pierwszego.</p>
          ) : (
            <ul className="list">
              {authors.map((a) => (
                <li key={a.id} className={'item' + (selected?.id === a.id ? ' active' : '')}
                  onClick={() => setSelected(a)}>
                  <span className="name">{a.imie}</span>
                  <span className="pill">{countOf(a)} książek</span>
                  <button className="x" title="Usuń autora"
                    onClick={(e) => { e.stopPropagation(); removeAuthor(a) }}>✕</button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* KSIĄŻKI WYBRANEGO AUTORA */}
        <section className="panel">
          <h2>Książki {selected ? <>autora: <b>{selected.imie}</b></> : ''}</h2>

          {!selected ? (
            <p className="muted">← Wybierz autora z lewej, aby zobaczyć i dodać jego książki.</p>
          ) : (
            <>
              <form className="row" onSubmit={addBook}>
                <input className="input grow" placeholder="Tytuł książki"
                  value={bookTitle} onChange={(e) => setBookTitle(e.target.value)} />
                <input className="input year" placeholder="Rok" inputMode="numeric"
                  value={bookYear} onChange={(e) => setBookYear(e.target.value)} />
                <button className="btn">Dodaj</button>
              </form>

              {loadingBooks ? (
                <p className="muted">Ładowanie…</p>
              ) : books.length === 0 ? (
                <p className="muted">Ten autor nie ma jeszcze książek.</p>
              ) : (
                <ul className="list">
                  {books.map((b) => (
                    <li key={b.id} className="item">
                      <span className="name">{b.tytul}</span>
                      {b.rok && <span className="pill soft">{b.rok}</span>}
                      <button className="x" title="Usuń książkę" onClick={() => removeBook(b.id)}>✕</button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>
      </div>

      <footer className="foot">
        Backend: Next.js API (własne endpointy <code>/api/autorzy</code>, <code>/api/ksiazki</code>) ·
        baza: Supabase/Postgres · relacja <code>ksiazki.autor_id → autorzy.id</code> ·
        walidacja tytułu/imienia po stronie serwera.
      </footer>
    </main>
  )
}
