# Kouzelná škola počtů 🏰

Webová hra na procvičování sčítání a odčítání do 100, malé násobilky a dělení, ve stylu kouzelnické školy. Návrh hry je v [NAVRH.md](NAVRH.md).

## Co hra umí

- **Účty:** rodič se přihlásí e-mailem a heslem (zařízení si to pamatuje), dítě pak vybere svůj profil a zadá 4místný PIN.
- **Moudrý klobouk** vybere kolej podle tří otázek, nebo si ji dítě vybere samo.
- **Tři předměty po 8 úrovních:** Lektvary (sčítání a odčítání), Kouzelné formule (násobilka), Přeměňování (dělení).
- **Lekce po 10 příkladech:**
  - Příklady, ve kterých dítě chybuje, chodí častěji (Leitnerovy krabičky).
  - Při chybě se ukáže postup a příklad se na konci lekce zopakuje.
  - Nápověda „Lumos“ ukáže první krok postupu.
- **Odměny:**
  - Zlaťáky a XP za každou lekci, za lekci bez chyby a jednou denně bonus.
  - Série dní v řadě a hodnosti od Prvňáčka po Velkou mágyni.
- **Odemykání úrovní:** další úroveň se otevře po třech lekcích s aspoň 8 správnými odpověďmi z 10.
- **Obchod na Kouzelné ulici:** 22 věcí (hůlky, klobouky, pláště, šály, brýle, mazlíčci, košťata). Před koupí jde vidět, jak věc na postavě vypadá.
- **Rodičovská sekce** (chráněná heslem rodiče):
  - Přehled za týden a příklady, které dítěti nejdou.
  - Historie lekcí.
  - Ruční odemykání úrovní a změna PINu.
- **Funguje na telefonu, tabletu i notebooku.** Na notebooku jde psát i z klávesnice (číslice, Enter, Backspace).
- **Ukládání:** stav se ukládá do prohlížeče i na server. Když vypadne internet, lekce se odešle později.

## Technika

- **Frontend:** Preact, TypeScript, Vite (`src/`)
- **Backend:** Cloudflare Worker (`worker/index.ts`) a databáze D1 (`migrations/`)
- **Herní logika:** `src/game/` (úrovně, generátory příkladů, odměny, obchod). Pokrývají ji testy v `tests/`.

## Spuštění u sebe

```bash
npm install
```

```bash
npm run db:migrate:local
```

```bash
npm run preview
```

Hra pak běží na http://localhost:8787.

Testy:

```bash
npm test
```

## Nasazení na Cloudflare

Databáze `kouzelna-skola-poctu` už na Cloudflare existuje a má založené tabulky (její ID je ve `wrangler.toml`). Pro nasazení stačí na počítači v naklonovaném repozitáři spustit:

```bash
npm install
```

```bash
npx wrangler login
```

```bash
npm run deploy
```

Při `wrangler login` vyber účet, kde je databáze. Hra pak poběží na adrese `https://kouzelna-skola-poctu.<subdoména-účtu>.workers.dev`. Stejnými příkazy se nasazuje i každá další verze.

Když přibude nová migrace v `migrations/`, spusť před nasazením:

```bash
npm run db:migrate:remote
```

## Úpravy

- **Obtížnost a úrovně:** `src/game/levels.ts`. Zde jsou počty úrovní, výchozí odemčení a hranice pro úspěšnou lekci.
- **Odměny a hodnosti:** `src/game/state.ts` (`REWARDS`, `RANKS`)
- **Věci v obchodě a ceny:** `src/game/shop.ts`
- **Koleje a otázky moudrého klobouku:** `src/game/houses.ts`
