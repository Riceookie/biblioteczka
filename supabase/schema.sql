-- Schemat „Biblioteczki". Uruchom w Supabase → SQL Editor → New query → Run.
-- Dwie tabele w relacji JEDEN DO WIELU: jeden autor ma wiele książek.

-- Tabela nadrzędna: autorzy.
create table if not exists autorzy (
  id         uuid primary key default gen_random_uuid(),
  imie       text not null,
  created_at timestamptz not null default now(),
  constraint autorzy_imie_not_blank check (char_length(btrim(imie)) > 0)
);

-- Tabela podrzędna: książki. Klucz obcy autor_id wskazuje na autorzy.id.
-- ON DELETE CASCADE: usunięcie autora kasuje też jego książki (spójność danych).
create table if not exists ksiazki (
  id         uuid primary key default gen_random_uuid(),
  autor_id   uuid not null references autorzy(id) on delete cascade,
  tytul      text not null,
  rok        int,
  created_at timestamptz not null default now(),
  constraint ksiazki_tytul_not_blank check (char_length(btrim(tytul)) > 0),
  constraint ksiazki_rok_sensowny check (rok is null or rok between 0 and 2100)
);

-- Indeks: szybkie pobieranie książek danego autora (filtr po kluczu obcym).
create index if not exists ksiazki_autor_idx on ksiazki(autor_id);

-- ── Row Level Security ──────────────────────────────────────────────────────
-- To aplikacja demonstracyjna BEZ logowania: front łączy się kluczem anon
-- (publicznym), więc żeby cokolwiek działało, jawnie zezwalamy roli anon na
-- odczyt i zapis. CHECK-i wyżej pilnują poprawności danych.
-- (W aplikacji z kontami polityki ograniczyłyby dostęp do właściciela — por.
--  wcześniejsze zadanie „Logowanie, sesja i role".)

alter table autorzy enable row level security;
alter table ksiazki enable row level security;

create policy "anon full access autorzy" on autorzy
  for all to anon using (true) with check (true);

create policy "anon full access ksiazki" on ksiazki
  for all to anon using (true) with check (true);
