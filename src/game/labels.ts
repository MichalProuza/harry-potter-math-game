const TYPE_LABELS: Record<string, string> = {
  add20: 'sčítání do 20',
  sub20: 'odčítání do 20',
  addTens: 'sčítání desítek',
  subTens: 'odčítání desítek',
  add21: 'sčítání bez přechodu (43 + 5)',
  sub21: 'odčítání bez přechodu (47 − 3)',
  add21c: 'sčítání s přechodem (47 + 8)',
  sub21c: 'odčítání s přechodem (52 − 7)',
  add22: 'sčítání dvojciferných (43 + 25)',
  sub22: 'odčítání dvojciferných (68 − 23)',
  add22c: 'sčítání dvojciferných s přechodem (47 + 38)',
  sub22c: 'odčítání dvojciferných s přechodem (72 − 29)',
  missAdd: 'chybějící sčítanec (35 + ? = 62)',
  missSub: 'chybějící menšenec (? − 8 = 30)',
  missSubtrahend: 'chybějící menšitel (50 − ? = 32)',
};

/** Čitelný popis klíče příkladu pro rodičovský přehled. */
export function keyLabel(key: string): string {
  if (TYPE_LABELS[key]) return TYPE_LABELS[key];
  const m = /^(m|mm|d)(\d+)x(\d+)$/.exec(key);
  if (!m) return key;
  const a = Number(m[2]);
  const b = Number(m[3]);
  if (m[1] === 'm') return `${a} · ${b} = ${a * b}`;
  if (m[1] === 'mm') return `${a} · ? = ${a * b}`;
  return `${a * b} : ${a} = ${b}`;
}
