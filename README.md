# 📚 Biblioteczka — mini-aplikacja z bazą i relacją

Mała aplikacja pokazująca **relację jeden-do-wielu** w bazie danych:
**jeden autor ma wiele książek**. Dodajesz autorów, wybierasz autora i zarządzasz
jego książkami. Przy każdym autorze widać **liczbę jego książek** (policzoną po
relacji), a usunięcie autora kasuje też jego książki (kaskada).

**Stack:** Vite + React + [Supabase](https://supabase.com) (Postgres).
Front jest w pełni statyczny (GitHub Pages) i rozmawia z Supabase wprost przez
`supabase-js`.

**Demo:** https://riceookie.github.io/biblioteczka/

## Model danych (relacja)

```
autorzy (id, imie)
   │  1
   │
   │  *            klucz obcy: ksiazki.autor_id → autorzy.id
   ▼
ksiazki (id, autor_id, tytul, rok)     ON DELETE CASCADE
```

Pełny schemat: [`supabase/schema.sql`](supabase/schema.sql).

## Uruchomienie lokalne

1. Utwórz projekt w Supabase i uruchom `supabase/schema.sql`
   (SQL Editor → New query → wklej → Run).
2. Skopiuj `.env.example` → `.env` i wpisz `VITE_SUPABASE_URL` oraz
   `VITE_SUPABASE_ANON_KEY` (Project Settings → API — klucz **anon/publishable**).
3. `npm install`
4. `npm run dev`

## Bezpieczeństwo

We froncie używamy **klucza anon** — jest publiczny z założenia. Dostępu do danych
pilnują **polityki RLS** w bazie, a poprawności — więzy `CHECK` i klucz obcy.
Klucza `service_role` **nigdy** nie umieszczamy we froncie.

Uwaga: to demo bez logowania, więc RLS celowo dopuszcza odczyt/zapis dla roli
`anon`. W aplikacji z kontami polityki ograniczyłyby dostęp do właściciela danych.

## Build i deploy (GitHub Pages)

```
npm run build      # tworzy dist/
```
`dist/` publikujemy na branchu `gh-pages`. `vite.config.js` ma
`base: '/biblioteczka/'`, żeby ścieżki pasowały do adresu Pages.
