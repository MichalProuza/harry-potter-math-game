# Kouzelná škola počtů – návrh hry

Webová hra pro osmiletou holku na procvičování **malé násobilky** a **sčítání a odčítání do 100**, ve stylu kouzelnické školy (inspirace Harrym Potterem).

## Požadavky (ze zadání)

| Požadavek | Jak ho návrh řeší |
|---|---|
| Malá násobilka | Samostatná větev „Kouzelné formule“, násobilka 2–10 |
| Dělení | Samostatná větev „Přeměňování“, dělení v oboru násobilky |
| Sčítání a odčítání do 100 | Samostatná větev „Lektvary“, od jednoduchých příkladů po přechod přes desítku |
| Styl Harry Potter | Moudrý klobouk, koleje, hůlky, pláště, předměty, kouzla, galeony (originální názvy z knih) |
| Vlastní účet | Profil dítěte (jméno a PIN nebo obrázkové heslo) pod rodičovským účtem, **od první verze** |
| Progress | Mapa hradu, úrovně, hvězdičky, odznaky, statistiky |
| Odemykání úrovní | Úroveň se odemkne po zvládnutí předchozí |
| Body | XP (zkušenosti) a galeony (měna) |
| Nákup výbavy | Obchod na Příčné ulici: hůlky, hábity, mazlíčci, košťata, vybavení pokoje |

## Rozhodnutí

- Dcera chodí do **3. třídy**: sčítání a odčítání do 100 a násobilku 2, 5, 10, 3, 4 už zná, ve 3. třídě dokončuje násobilku a přidává dělení.
- Hraje na **notebooku, tabletu i telefonu**, takže vše je responzivní a ovládá se dotykem i klávesnicí.
- Zatím **jedna hráčka**, ale účet podporuje víc profilů.
- **Dělení je součástí** jako třetí větev.

## 1. Struktura učení: tři souběžné větve

Ve škole se sčítání, násobilka a dělení probírají souběžně, proto nejsou v jedné lineární řadě, ale ve **třech nezávislých větvích**. Dcera může procvičovat přesně to, co zrovna dělají ve škole.

Výchozí odemčení pro 3. třídu: Lektvary úrovně 1–3, Kouzelné formule 1–3, Přeměňování 1. Rodič může v rodičovské sekci odemknout další.

**Lektvary (sčítání a odčítání)**
1. Do 20 (rozcvička)
2. Celé desítky (30 + 40, 90 − 60)
3. Dvojciferné + jednociferné bez přechodu (43 + 5, 47 − 3)
4. Dvojciferné + jednociferné s přechodem (47 + 8, 52 − 7)
5. Dvojciferné ± dvojciferné bez přechodu (43 + 25)
6. Dvojciferné ± dvojciferné s přechodem (47 + 38, 72 − 29)
7. Doplň chybějící číslo (35 + __ = 62)
8. Mistrovská zkouška: vše dohromady

**Kouzelné formule (násobilka)**
1. Násobení 2 a 10
2. Násobení 5
3. Násobení 3 a 4
4. Násobení 6
5. Násobení 7
6. Násobení 8 a 9
7. Míchaná násobilka
8. Mistrovská zkouška (i s chybějícím činitelem: 7 · ? = 56)

**Přeměňování (dělení)**
1. Dělení 2 a 10
2. Dělení 5
3. Dělení 3 a 4
4. Dělení 6
5. Dělení 7
6. Dělení 8 a 9
7. Míchané dělení
8. Mistrovská zkouška (násobení i dělení na přeskáčku)

- Úroveň má 3 lekce. Další úroveň se odemkne, když 3 lekce skončí s úspěšností alespoň 80 %.
- Rodič může úroveň odemknout ručně (když už to mají ve škole probrané).
- Hotové úrovně jdou kdykoli opakovat a dají se vylepšit na 3 hvězdičky.

## 2. Herní smyčka

1. Lekce: 10 příkladů, asi 5 minut.
2. Za každou správnou odpověď XP a galeony. **Chyba nic nebere.** Příklad se na konci lekce zopakuje a ukáže se postup.
3. Konec lekce: hvězdičky (1–3), odměna a případně nová kouzelná kartička.
4. Galeony se utratí v obchodě, výbava je vidět na postavě a v pokoji.

Doplňky:
- **Denní úkol** (jedna lekce): bonusové galeony a série dní. Přerušení série nic nestrhává.
- **Pohár kolejí**: XP přidávají body koleji, která na týdenním žebříčku soupeří s ostatními (fiktivními) kolejemi. Nikdy se nesrovnává s jinými dětmi.

## 3. Herní režimy (aby to nebyl jen dril)

| Režim | Mechanika |
|---|---|
| Hodina (základ) | Klasické příklady s klávesnicí na obrazovce |
| Míchání lektvaru | Vyber 2 přísady, jejichž součet dává zadané číslo |
| Kouzelnický souboj | Každá správná odpověď je zásah do soupeře (bubák, troll); boss na konci úrovně |
| Famfrpál | Chytání zlatonky: odpověz dřív, než uletí (časový režim, jen dobrovolný) |
| Pravda nebo lež | Je 7 × 8 = 54? Rychlé ano/ne |

Časový tlak se objevuje jen v dobrovolných režimech, ne v běžných lekcích.

## 4. Body a obchod

- **XP**: ukazují postup postavy (úroveň kouzelníka) a nedají se utratit.
- **Galeony**: 1 za správnou odpověď, +5 za dokončenou lekci, +10 za 3 hvězdičky, +10 za denní úkol.
- Jedna lekce tedy vynese asi 15–25 galeonů.

**Obchod na Příčné ulici**

| Kategorie | Příklady | Cena |
|---|---|---|
| Hůlky | dřevo (dub, jasan, vrba) × jádro (fénix, drak, jednorožec) | 50–200 |
| Hábity a doplňky | šála v barvě koleje, klobouk, brýle | 20–80 |
| Mazlíčci | sova, kočka, ropucha, fénix (vzácný) | 100–300 |
| Košťata | Školní, Rychlík, Blesk | 80–300 |
| Pokoj | postel s nebesy, svíčky, plakáty, knihovna | 20–150 |

Ceny jsou nastavené tak, aby se drobnost dala koupit po 1–2 lekcích a velká věc za týden pravidelného hraní.

**Kouzelné kartičky** (jako čokoládové žabky): sbírka 30 originálních postav, jedna za každou lekci. Postavy jsou vymyšlené, nejde o oficiální. Kartičky se nedají kupovat, jen vyhrát.

## 5. Adaptivní učení

- **Násobilka** má jen 100 příkladů, proto se sleduje **každý příklad zvlášť** (Leitnerovy krabičky 1–5). Chybné příklady se vracejí častěji.
- **Sčítání a odčítání** se generuje náhodně podle pravidla úrovně. Sleduje se úspěšnost **podle typu** (např. „odčítání s přechodem“), ne podle jednotlivých příkladů.
- Lekce mixuje asi 70 % aktuální látky a 30 % opakování slabých míst.
- **Nápověda** (kouzlo Lumos) ukáže postup: 47 + 38 = 47 + 30 + 8, u násobilky obrázek skupin. Za nápovědu se nic neodečítá.

## 6. Účty

- **Rodičovský účet** (e-mail a heslo) založí profil dítěte. Do jednoho účtu jde přidat víc dětí.
- **Dítě se přihlásí** kliknutím na svůj profil a zadáním 4místného PINu nebo výběrem 3 obrázků (bez e-mailu, bez osobních údajů).
- Pokrok se ukládá na server, takže funguje na tabletu i na počítači.
- **Rodičovský přehled**: čas strávený hraním, úspěšnost podle typu příkladů, problematické příklady, ruční odemykání úrovní, volitelný denní limit.
- Žádný chat, reklamy ani platby.

## 7. Ovládání a vzhled

- Primárně tablet, funguje i na telefonu a počítači.
- Velká klávesnice s čísly na obrazovce, na počítači i fyzická klávesnice.
- Tmavé „hradní“ pozadí, zlaté akcenty, barvy podle koleje, jiskřivé animace při správné odpovědi.
- Grafika je vlastní (SVG a emoji), bez oficiálních log a obrázků. Názvy kolejí, měny a míst jsou z knih (hra je jen pro soukromé, nekomerční použití).
- Volitelné zvuky s možností vypnutí.

## 8. Technické řešení

- **Frontend**: Vite + TypeScript + Preact, PWA (instalace na plochu tabletu).
- **Backend**: Cloudflare Pages + Workers + D1 (SQLite), provoz zdarma.
- **Datový model**:
  - `parents` – rodičovský účet
  - `players` – dítě: jméno, hash PINu, kolej, XP, galeony, vybavení
  - `level_progress` – hráč, větev, úroveň, hvězdičky, odemčeno
  - `fact_stats` – hráč, příklad nebo typ, krabička, úspěšnost
  - `inventory` – vlastněné předměty a kartičky
  - `sessions` – historie lekcí (pro rodičovský přehled)
- Logika úrovní a obsah obchodu jsou v konfiguraci, aby šly snadno upravovat.

## 9. Plán vývoje

1. **MVP**: přihlášení (rodič + profil dítěte), výběr koleje, všechny větve a úrovně, lekce s adaptivním výběrem, galeony, obchod s 22 předměty, postava s výbavou.
2. **Verze 2**: všechny úrovně, souboj s bossem, kartičky, denní úkol, mapa hradu.
3. **Verze 3**: rodičovský přehled, minihry (lektvary, famfrpál), pokoj, pohár kolejí.
4. **Doladění podle dcery**: hraje, říká, co ji baví a co ne. Podle toho upravit obtížnost a odměny.

## 10. Stav

MVP je hotové (viz README): účty, výběr koleje, všechny tři větve se všemi úrovněmi, adaptivní lekce s postupy, galeony, obchod s 22 věcmi, postava s výbavou, denní bonus a série, rodičovský přehled.

Další na řadě (verze 2): souboj s bossem, kouzelné kartičky, mapa hradu, minihry.
