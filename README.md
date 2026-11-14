# Kouzelná škola počtů 🏰

Webová hra na procvičování sčítání a odčítání do 100, malé násobilky a dělení, ve stylu kouzelnické školy. Návrh hry je v [NAVRH.md](NAVRH.md). Návrh popisuje i věci, které hotové nejsou (minihry, kartičky, pohár kolejí, pokoj, zvuky). Co hra opravdu umí, je popsáno tady.

## Co hra umí

- **Účty:** rodič se přihlásí e-mailem a heslem (zařízení si to pamatuje rok), dítě pak vybere svůj profil a zadá 4místný PIN (platí 30 dní). Pod jedním účtem může být nejvýš 6 profilů.
- **Moudrý klobouk** vybere kolej (Nebelvír, Havraspár, Zmijozel, Mrzimor) podle tří otázek, nebo si ji dítě vybere samo.
- **Tři předměty po 8 úrovních:** Lektvary (sčítání a odčítání), Kouzelné formule (násobilka), Přeměňování (dělení). Od začátku jsou odemčené úrovně 1–3 v Lektvarech a Kouzelných formulích a úroveň 1 v Přeměňování.
- **Lekce po 10 příkladech:**
  - Když už dítě hrálo nižší úrovně téhož předmětu, jsou 3 příklady z 10 opakování z nich. Jinak je všech 10 z hrané úrovně.
  - Příklady, ve kterých dítě chybuje nebo které dlouho neprocvičovalo, chodí častěji. Spoje s 1 a 10 chodí méně často.
  - Po chybě má dítě druhý pokus s nápovědou. Když nevyjde ani ten, ukáže se celý postup. Příklad se na konci lekce zopakuje.
  - Do výsledku lekce se počítá jen první odpověď na každý příklad.
  - Nápověda „Lumos“ ukáže první krok postupu. Galeony za odpověď zůstávají.
- **Kdy se příklad počítá jako zvládnutý:**
  - Spoj násobilky nebo dělení postupuje jen po správné odpovědi bez nápovědy do 6 sekund. Čas se měří skrytě, dítě žádné stopky nevidí. 7 · 8 a 8 · 7 je jeden spoj.
  - U sčítání a odčítání rozhoduje úspěšnost z posledních 10 pokusů daného typu. Odpověď s nápovědou se do ní nepočítá.
- **Odměny:**
  - Za lekci 1 galeon a 10 XP za každou správnou odpověď a k tomu 5 galeonů a 20 XP. Za lekci bez chyby 10 galeonů navíc, za první lekci dne také 10.
  - Hvězdičky za lekci: 3 za všech 10 správně, 2 od 8, 1 od 5.
  - Série dní v řadě a hodnosti od Prvňáčka po Velkou mágyni.
- **Odemykání úrovní:** další úroveň se otevře po třech lekcích s aspoň 8 správnými odpověďmi z 10.
- **Obchod na Příčné ulici:** 22 věcí (hůlky, klobouky, pláště, šály, brýle, mazlíčci, košťata). Školní hůlku má každý od začátku, ostatních 21 se kupuje za galeony. Před koupí jde vidět, jak věc na postavě vypadá.
- **Rodičovská sekce** (před vstupem se ptá na heslo rodiče):
  - Přehled za týden a příklady, které dítěti nejdou.
  - Historie posledních 15 lekcí i s příklady, ve kterých dítě chybovalo.
  - Ruční odemykání úrovní a změna PINu.
- **Funguje na telefonu, tabletu i notebooku.** Na notebooku jde psát i z klávesnice (číslice, Enter, Backspace).
- **Ukládání:** stav se ukládá do prohlížeče i na server. Když vypadne internet, lekce se odešle později. K načtení samotné hry je připojení potřeba.
- **Rozehraná lekce se neztratí:**
  - Po obnovení stránky nebo zavření prohlížeče pokračuje tam, kde skončila (do 30 minut).
  - Tlačítko Zpět v prohlížeči nebo na tabletu vede o obrazovku výš. V lekci se nejdřív zeptá.
  - Když dítě lekci ukončí dřív, galeony nedostane, ale spočítané příklady se do statistik započítají.
- **Verze hry** (commit a datum sestavení) je vidět dole na výběru profilu.

## Technika

- **Frontend:** Preact, TypeScript, Vite (`src/`)
- **Backend:** Cloudflare Worker (`worker/index.ts`) a databáze D1 (`migrations/`)
- **Herní logika:** `src/game/` (úrovně, generátory příkladů, odměny, obchod). Pokrývají ji testy v `tests/`.

Kde co je:

- `index.html`, `src/main.tsx`: vstupní bod hry.
- `src/app.tsx`: přepínání obrazovek a tlačítko Zpět.
- `src/screens/`: obrazovky (přihlášení a profily, Velká síň a mapa úrovní, lekce a výsledek, obchod, rodičovská sekce).
- `src/components/`: postava s výbavou, kreslené obrázky (SVG), klávesnice.
- `src/game/`: herní logika bez závislosti na prohlížeči.
- `src/api.ts`: volání serveru. Přihlašovací tokeny jsou v `localStorage` prohlížeče.
- `src/session.ts`: stav přihlášeného dítěte, ukládání do prohlížeče a odesílání na server.
- `src/lessonStore.ts`: rozehraná lekce uložená v prohlížeči.
- `src/styles.css`: vzhled.
- `worker/index.ts`: API pod `/api/` (účty, profily, PIN, uložení stavu, rodičovský přehled). Všechno ostatní Cloudflare servíruje ze složky `dist`.
- `migrations/0001_init.sql`: tabulky `parents`, `players`, `sessions`, `lessons`. Herní stav dítěte je uložený jako JSON v `players.state_json`.
- `public/`: ikona a manifest pro přidání hry na plochu.
- `wrangler.toml`: nastavení Workeru a databáze.

Stav hry (galeony, postup, výbava) počítá prohlížeč a server ho ukládá tak, jak ho dostane.

## Spuštění u sebe

Je potřeba Node.js (kontrola na GitHubu běží na verzi 22).

```bash
npm install
```

```bash
npm run db:migrate:local
```

```bash
npm run preview
```

Hra pak běží na http://localhost:8787. Příkaz hru sestaví do `dist` a spustí Worker s místní databází ve složce `.wrangler`.

Při úpravách vzhledu a obrazovek se hodí ještě vývojový server, který se po změně sám obnovuje. Spouští se ve druhém okně vedle `npm run preview`, protože volání `/api` posílá na port 8787:

```bash
npm run dev
```

Hra pak běží na http://localhost:5173.

Testy:

```bash
npm test
```

Testy (Vitest, `tests/game.test.ts`) pokrývají jen herní logiku v `src/game/`. Server, synchronizace a obrazovky testy nemají.

Typová kontrola hry i serveru:

```bash
npm run typecheck
```

## Nasazení a vývoj

Hra běží na https://kouzelna-skola-poctu.michal-prouza.workers.dev.

- **Automatické nasazení:** Cloudflare Workers Builds sleduje větev `main`. Po každé změně v ní hru sám sestaví (`npm run build`) a nasadí (`npx wrangler deploy`). Průběh je v Cloudflare u Workeru v záložce Deployments. Tohle propojení se nastavuje v Cloudflare, v repozitáři k němu žádný soubor není.
- **Kontrola na GitHubu:** u každého pull requestu a pushe do `main` běží GitHub Action (`.github/workflows/ci.yml`). Spustí typovou kontrolu, testy a sestavení.
- **Postup změn:** změna se připraví ve vedlejší větvi, otevře se pull request do `main`, po zelené kontrole se sloučí a nasadí se sama.
- **Databáze:** `kouzelna-skola-poctu` (ID ve `wrangler.toml`). Nové migrace v `migrations/` se při nasazení samy neprovedou, je potřeba je spustit zvlášť:

  ```bash
  npm run db:migrate:remote
  ```

- **Ruční nasazení z počítače** (když je potřeba). Před nasazením proběhne typová kontrola a sestavení, testy ne:

  ```bash
  npx wrangler login
  ```

  ```bash
  npm run deploy
  ```

## Úpravy

- **Obtížnost a úrovně:** `src/game/levels.ts`. Zde jsou počty úrovní, výchozí odemčení a hranice pro úspěšnou lekci.
- **Typy příkladů a postupy v nápovědě:** `src/game/problems.ts`
- **Odměny a hodnosti:** `src/game/state.ts` (`REWARDS`, `RANKS`)
- **Zvládnutí příkladů:** `src/game/state.ts` (`FLUENT_MS` je limit na rychlou odpověď, `RECENT_WINDOW` počet sledovaných pokusů). Váhy výběru a podíl opakování jsou v `src/game/lesson.ts`.
- **Věci v obchodě a ceny:** `src/game/shop.ts`
- **Koleje a otázky moudrého klobouku:** `src/game/houses.ts`
- **Jak dlouho se drží rozehraná lekce:** `src/lessonStore.ts` (`RESUME_LIMIT_MS`)
- **Délka přihlášení a počet profilů:** `worker/index.ts` (`PARENT_SESSION_DAYS`, `PLAYER_SESSION_DAYS`, `MAX_PLAYERS_PER_PARENT`)
