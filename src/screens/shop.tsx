import { useState } from 'preact/hooks';
import type { Go } from '../app';
import { Avatar } from '../components/Avatar';
import { TopBar } from '../components/common';
import { SHOP_ITEMS, SLOT_NAMES, type ShopItem, type Slot } from '../game/shop';
import { buyItem, toggleEquip } from '../game/state';
import { type PlayerSession, session } from '../session';

const SLOTS = Object.keys(SLOT_NAMES) as Slot[];

export function Shop({ go, s }: { go: Go; s: PlayerSession }) {
  const [slot, setSlot] = useState<Slot>('wand');
  const [selected, setSelected] = useState<ShopItem | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const { state } = s;

  // náhled: vybraná věc se ukáže na postavě ještě před koupí
  const preview = selected ? { ...state.equipped, [selected.slot]: selected.id } : state.equipped;

  function buy(item: ShopItem) {
    try {
      session.commit(buyItem(state, item.id));
      setMessage(`🎉 ${item.name} je tvoje!`);
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  function equip(item: ShopItem) {
    session.commit(toggleEquip(state, item.id));
    setMessage(null);
  }

  const items = SHOP_ITEMS.filter((i) => i.slot === slot && (i.price > 0 || state.owned.includes(i.id)));

  return (
    <main class="screen">
      <TopBar session={s} onBack={() => go({ name: 'hub' })} title="🛍️ Příčná ulice" />
      <div class="shop">
        <aside class="shop__preview">
          <Avatar house={state.house} equipped={preview} size={170} animated />
          {selected ? (
            <div class="shop__detail">
              <h2>{selected.name}</h2>
              <p class="muted">{selected.description}</p>
              <ItemAction item={selected} s={s} onBuy={buy} onEquip={equip} />
            </div>
          ) : (
            <p class="muted center">Klepni na věc a uvidíš, jak ti sluší.</p>
          )}
          {message && (
            <p class="badge" role="status">
              {message}
            </p>
          )}
        </aside>
        <section class="shop__main">
          <div class="chips" role="tablist">
            {SLOTS.map((sl) => (
              <button
                type="button"
                key={sl}
                role="tab"
                aria-selected={sl === slot}
                class={sl === slot ? 'chip chip--on' : 'chip'}
                onClick={() => {
                  setSlot(sl);
                  setSelected(null);
                  setMessage(null);
                }}
              >
                {SLOT_NAMES[sl]}
              </button>
            ))}
          </div>
          <div class="items">
            {items.map((item) => {
              const owned = state.owned.includes(item.id);
              const worn = state.equipped[item.slot] === item.id;
              return (
                <button
                  type="button"
                  key={item.id}
                  class={`item ${selected?.id === item.id ? 'item--selected' : ''} ${owned ? 'item--owned' : ''}`}
                  onClick={() => {
                    setSelected(item);
                    setMessage(null);
                  }}
                >
                  <span class="item__preview">
                    <Avatar house={state.house} equipped={{ [item.slot]: item.id }} size={70} />
                  </span>
                  <span class="item__name">{item.name}</span>
                  <span class="item__price">{worn ? '✅ nosíš' : owned ? 'máš' : `🪙 ${item.price}`}</span>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}

function ItemAction({
  item,
  s,
  onBuy,
  onEquip,
}: {
  item: ShopItem;
  s: PlayerSession;
  onBuy: (i: ShopItem) => void;
  onEquip: (i: ShopItem) => void;
}) {
  const owned = s.state.owned.includes(item.id);
  const worn = s.state.equipped[item.slot] === item.id;
  if (owned) {
    if (worn && item.slot === 'wand') return <p class="muted">Tuhle hůlku právě používáš.</p>;
    return (
      <button type="button" class="btn" onClick={() => onEquip(item)}>
        {worn ? 'Sundat' : 'Nasadit'}
      </button>
    );
  }
  const missing = item.price - s.state.coins;
  if (missing > 0) {
    return (
      <p class="muted">
        Cena 🪙 {item.price}. Chybí ti ještě <strong>{missing}</strong> galeonů – to je pár lekcí!
      </p>
    );
  }
  return (
    <button type="button" class="btn btn--gold" onClick={() => onBuy(item)}>
      Koupit za 🪙 {item.price}
    </button>
  );
}
