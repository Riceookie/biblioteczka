import { useEffect, useState } from 'react'
import { supabase, isConfigured } from './supabase.js'

export default function App() {
  const [authors, setAuthors] = useState([])
  const [selected, setSelected] = useState(null) // wybrany autor (obiekt)
  const [books, setBooks] = useState([])

  const [loadingAuthors, setLoadingAuthors] = useState(true)
  const [loadingBooks, setLoadingBooks] = useState(false)
  const [error, setError] = useState(null)

  const [authorName, setAuthorName] = useState('')
  const [bookTitle, setBookTitle] = useState('')
  const [bookYear, setBookYear] = useState('')

  // --- Odczyt autorów wraz z LICZBĄ książek (to już użycie relacji) ---
  async function loadAuthors() {
    setLoadingAuthors(true)
    setError(null)
    // "ksiazki(count)" to zagnieżdżone zapytanie po relacji autor -> książki.
    const { data, error } = await supabase
      .from('autorzy')
      .select('id, imie, ksiazki(count)')
      .order('imie', { ascending: true })
    if (error) setError(error.message)
    else setAuthors(data ?? [])
    setLoadingAuthors(false)
  }

  // --- Odczyt książek wybranego autora (filtr po kluczu obcym autor_id) ---
  async function loadBooks(autorId) {
    setLoadingBooks(true)
    setError(null)
    const { data, error } = await supabase
      .from('ksiazki')
      .select('id, tytul, rok')
      .eq('autor_id', autorId)
      .order('rok', { ascending: true })
    if (error) setError(error.message)
    else setBooks(data ?? [])
    setLoadingBooks(false)
  }

  useEffect(() => {
    if (isConfigured) loadAuthors()
  }, [])

  useEffect(() => {
    if (selected) loadBooks(selected.id)
    else setBooks([])
  }, [selected])

  // --- CREATE autor ---
  async function addAuthor(e) {
    e.preventDefault()
    const imie = authorName.trim()
    if (!imie) return
    setError(null)
    const { data, error } = await supabase
      .from('autorzy')
      .insert({ imie })
      .select('id, imie, ksiazki(count)')
      .single()
    if (error) { setError(error.message); return }
    setAuthorName('')
    setAuthors((prev) => [...prev, data].sort((a, b) => a.imie.localeCompare(b.imie, 'pl')))
  }

  // --- CREATE książka (przypięta do wybranego autora) ---
  async function addBook(e) {
    e.preventDefault()
    if (!selected) return
    const tytul = bookTitle.trim()
    if (!tytul) return
    const rok = bookYear.trim() ? Number(bookYear.trim()) : null
    setError(null)
    const { data, error } = await supabase
      .from('ksiazki')
      .insert({ autor_id: selected.id, tytul, rok })
      .select('id, tytul, rok')
      .single()
    if (error) { setError(error.message); return }
    setBookTitle(''); setBookYear('')
    setBooks((prev) => [...prev, data])
    bumpCount(selected.id, +1)
  }

  // --- DELETE książka ---
  async function removeBook(id) {
    setError(null)
    const { error } = await supabase.from('ksiazki').delete().eq('id', id)
    if (error) { setError(error.message); return }
    setBooks((prev) => prev.filter((b) => b.id !== id))
    bumpCount(selected.id, -1)
  }

  // --- DELETE autor (kasuje też jego książki dzięki ON DELETE CASCADE) ---
  async function removeAuthor(author) {
    if (!confirm(`Usunąć autora „${author.imie}" wraz z jego książkami?`)) return
    setError(null)
    const { error } = await supabase.from('autorzy').delete().eq('id', author.id)
    if (error) { setError(error.message); return }
    setAuthors((prev) => prev.filter((a) => a.id !== author.id))
    if (selected?.id === author.id) setSelected(null)
  }

  // Lokalna aktualizacja licznika książek przy autorze (bez ponownego zapytania).
  function bumpCount(autorId, delta) {
    setAuthors((prev) =>
      prev.map((a) =>
        a.id === autorId
          ? { ...a, ksiazki: [{ count: (a.ksiazki?.[0]?.count ?? 0) + delta }] }
          : a,
      ),
    )
  }

  const countOf = (a) => a.ksiazki?.[0]?.count ?? 0

  if (!isConfigured) {
    return (
      <main className="wrap">
        <h1>📚 Biblioteczka</h1>
        <div className="banner error">
          <strong>Brak konfiguracji Supabase.</strong> Ustaw <code>VITE_SUPABASE_URL</code> i
          {' '}<code>VITE_SUPABASE_ANON_KEY</code> (plik <code>.env</code>) i zbuduj ponownie.
        </div>
      </main>
    )
  }

  return (
    <main className="wrap">
      <header className="head">
        <h1>📚 Biblioteczka</h1>
        <p className="sub">Relacja <b>jeden do wielu</b>: jeden autor — wiele książek.</p>
      </header>

      {error && <div className="banner error">⚠️ {error}</div>}

      <div className="cols">
        {/* KOLUMNA 1 — AUTORZY */}
        <section className="panel">
          <h2>Autorzy</h2>
          <form className="row" onSubmit={addAuthor}>
            <input
              className="input"
              placeholder="Imię i nazwisko autora"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
            />
            <button className="btn">Dodaj</button>
          </form>

          {loadingAuthors ? (
            <p className="muted">Ładowanie…</p>
          ) : authors.length === 0 ? (
            <p className="muted">Brak autorów — dodaj pierwszego.</p>
          ) : (
            <ul className="list">
              {authors.map((a) => (
                <li
                  key={a.id}
                  className={'item' + (selected?.id === a.id ? ' active' : '')}
                  onClick={() => setSelected(a)}
                >
                  <span className="name">{a.imie}</span>
                  <span className="pill">{countOf(a)} książek</span>
                  <button
                    className="x"
                    title="Usuń autora"
                    onClick={(e) => { e.stopPropagation(); removeAuthor(a) }}
                  >✕</button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* KOLUMNA 2 — KSIĄŻKI WYBRANEGO AUTORA */}
        <section className="panel">
          <h2>
            Książki {selected ? <>autora: <b>{selected.imie}</b></> : ''}
          </h2>

          {!selected ? (
            <p className="muted">← Wybierz autora z lewej, aby zobaczyć i dodać jego książki.</p>
          ) : (
            <>
              <form className="row" onSubmit={addBook}>
                <input
                  className="input grow"
                  placeholder="Tytuł książki"
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                />
                <input
                  className="input year"
                  placeholder="Rok"
                  inputMode="numeric"
                  value={bookYear}
                  onChange={(e) => setBookYear(e.target.value)}
                />
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
        Vite + React + Supabase · dane w tabelach <code>autorzy</code> i <code>ksiazki</code>
        {' '}(klucz obcy <code>ksiazki.autor_id → autorzy.id</code>).
      </footer>
    </main>
  )
}
