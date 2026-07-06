# 📚 Biblioteczka — mini-aplikacja z bazą i relacją (Next.js + Supabase)

Aplikacja z **prawdziwym backendem Node.js** (Next.js API routes) i bazą
**Supabase/Postgres**. Pokazuje **relację jeden-do-wielu**: jeden autor ma wiele
książek. Dodajesz autorów, wybierasz autora i zarządzasz jego książkami; przy
każdym autorze widać liczbę książek (liczoną po relacji).

**Demo (Vercel):** https://biblioteczka.vercel.app/

## 📝 Notatka: jaka relacja i gdzie walidacja

**Relacja (jeden-do-wielu):**
```
autorzy (id, imie)
   │ 1
   │
   │ *      klucz obcy: ksiazki.autor_id → autorzy.id   (ON DELETE CASCADE)
   ▼
ksiazki (id, autor_id, tytul, rok)
```
Jeden **autor** może mieć wiele **książek**; każda książka należy do dokładnie
jednego autora przez klucz obcy `ksiazki.autor_id`. Usunięcie autora kasuje
kaskadowo jego książki. Definicja: [`supabase/schema.sql`](supabase/schema.sql).

**Gdzie jest walidacja:** **po stronie serwera**, w API routes — zanim cokolwiek
trafi do bazy:
- `app/api/autorzy/route.js` (POST) — **imię autora wymagane** (niepuste, ≤120 znaków).
- `app/api/ksiazki/route.js` (POST) — **tytuł książki wymagany** (niepusty, ≤200 znaków),
  wymagany `autor_id`, a `rok` (jeśli podany) musi być liczbą całkowitą 0–2100.

Serwer odrzuca złe dane kodem **400** z komunikatem, więc walidacji nie da się
obejść z przeglądarki. Dodatkowo baza ma więzy `CHECK` (druga linia obrony).

## Architektura

```
Przeglądarka (app/page.jsx)
   │  fetch do WŁASNEGO API (nie do bazy wprost)
   ▼
Next.js API routes (app/api/*)  ── walidacja + klucz service_role ──►  Supabase/Postgres
```
Klucz **service_role** (omija RLS) używany jest **wyłącznie na serwerze**
(`lib/supabase.js`) i nigdy nie trafia do przeglądarki.

## Uruchomienie lokalne

1. W Supabase uruchom [`supabase/schema.sql`](supabase/schema.sql) (SQL Editor → Run).
2. `cp .env.local.example .env.local` i wpisz `SUPABASE_URL` oraz
   `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API — klucz **service_role**).
3. `npm install`
4. `npm run dev` → http://localhost:3000

## Deploy (Vercel)

1. W Vercel: **New Project** → zaimportuj repo `Riceookie/biblioteczka`.
2. W **Settings → Environment Variables** dodaj `SUPABASE_URL` i
   `SUPABASE_SERVICE_ROLE_KEY` (te same wartości co lokalnie).
3. Deploy. GitHub Pages nie wystarczy — to apka z serwerem (API routes) i wymaga
   hostingu obsługującego Node.js.

## Endpointy API

| Metoda | Ścieżka | Opis |
|---|---|---|
| GET  | `/api/autorzy` | lista autorów + liczba książek (po relacji) |
| POST | `/api/autorzy` | dodaj autora (walidacja imienia) |
| DELETE | `/api/autorzy/:id` | usuń autora (kaskadowo książki) |
| GET  | `/api/ksiazki?autor_id=…` | książki danego autora |
| POST | `/api/ksiazki` | dodaj książkę (walidacja tytułu/roku) |
| DELETE | `/api/ksiazki/:id` | usuń książkę |
