# Kouzelná škola počtů 🏰

Webová hra na procvičování sčítání a odčítání do 100, malé násobilky a dělení, ve stylu kouzelnické školy. Návrh hry je v [NAVRH.md](NAVRH.md).

## Co hra umí

- **Účty:** rodič se přihlásí e-mailem a heslem (zařízení si to pamatuje), dítě pak vybere svůj profil a zadá 4místný PIN.
- **Moudrý klobouk** vybere kolej (Nebelvír, Havraspár, Zmijozel, Mrzimor) podle tří otázek, nebo si ji dítě vybere samo.
- **Tři předměty po 8 úrovních:** Lektvary (sčítání a odčítání), Kouzelné formule (násobilka), Přeměňování (dělení).
- **Lekce po 10 příkladech:**
  - Příklady, ve kterých dítě chybuje nebo které dlouho neprocvičovalo, chodí častěji. Spoje s 1 a 10 chodí méně často.
  - Po chybě má dítě druhý pokus s nápovědou. Když nevyjde ani ten, ukáže se celý postup. Příklad se na konci lekce zopakuje.
  - Nápověda „Lumos“ ukáže první krok postupu. Galeony za odpověď zůstávají.
- **Kdy se příklad počítá jako zvládnutý:**
  - Spoj násobilky nebo dělení postupuje jen po správné odpovědi bez nápovědy do 6 sekund. Čas se měří skrytě, dítě žádné stopky nevidí. 7 · 8 a 8 · 7 je jeden spoj.
  - U sčítání a odčítání rozhoduje úspěšnost z posledních 10 pokusů daného typu.
- **Odměny:**
  - Galeony a XP za každou lekci, za lekci bez chyby a jednou denně bonus.
  - Série dní v řadě a hodnosti od Prvňáčka po Velkou mágyni.
- **Odemykání úrovní:** další úroveň se otevře po třech lekcích s aspoň 8 správnými odpověďmi z 10.
- **Obchod na Příčné ulici:** 22 věcí (hůlky, klobouky, pláště, šály, brýle, mazlíčci, košťata). Před koupí jde vidět, jak věc na postavě vypadá.
- **Rodičovská sekce** (chráněná heslem rodiče):
  - Přehled za týden a příklady, které dítěti nejdou.
  - Historie lekcí.
  - Ruční odemykání úrovní a změna PINu.
- **Funguje na telefonu, tabletu i notebooku.** Na notebooku jde psát i z klávesnice (číslice, Enter, Backspace).
- **Ukládání:** stav se ukládá do prohlížeče i na server. Když vypadne internet, lekce se odešle později.
- **Rozehraná lekce se neztratí:**
  - Po obnovení stránky nebo zavření prohlížeče pokračuje tam, kde skončila (do 30 minut).
  - Tlačítko Zpět v prohlížeči nebo na tabletu vede o obrazovku výš. V lekci se nejdřív zeptá.
  - Když dítě lekci ukončí dřív, galeony nedostane, ale spočítané příklady se do statistik započítají.

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

## Nasazení a vývoj

Hra běží na https://kouzelna-skola-poctu.michal-prouza.workers.dev.

- **Automatické nasazení:** Cloudflare Workers Builds sleduje větev `main`. Po každé změně v ní hru sám sestaví (`npm run build`) a nasadí (`npx wrangler deploy`). Průběh je v Cloudflare u Workeru v záložce Deployments.
- **Kontrola na GitHubu:** u každého pull requestu a pushe do `main` běží GitHub Action (`.github/workflows/ci.yml`). Spustí typovou kontrolu, testy a sestavení.
- **Postup změn:** změna se připraví ve vedlejší větvi, otevře se pull request do `main`, po zelené kontrole se sloučí a nasadí se sama.
- **Databáze:** `kouzelna-skola-poctu` (ID ve `wrangler.toml`). Nové migrace v `migrations/` se při nasazení samy neprovedou, je potřeba je spustit zvlášť:

  ```bash
  npm run db:migrate:remote
  ```

- **Ruční nasazení z počítače** (když je potřeba):

  ```bash
  npx wrangler login
  ```

  ```bash
  npm run deploy
  ```

## Úpravy

- **Obtížnost a úrovně:** `src/game/levels.ts`. Zde jsou počty úrovní, výchozí odemčení a hranice pro úspěšnou lekci.
- **Odměny a hodnosti:** `src/game/state.ts` (`REWARDS`, `RANKS`)
- **Zvládnutí příkladů:** `src/game/state.ts` (`FLUENT_MS` je limit na rychlou odpověď, `RECENT_WINDOW` počet sledovaných pokusů). Váhy výběru jsou v `src/game/lesson.ts`.
- **Věci v obchodě a ceny:** `src/game/shop.ts`
- **Koleje a otázky moudrého klobouku:** `src/game/houses.ts`
