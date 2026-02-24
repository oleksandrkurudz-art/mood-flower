"use client";

import { useMemo, useState } from 'react';

const MIN_ORDER_TOTAL = 700;

function normalizeCategory(value) {
  return value === 'bouquet' || value === 'bouquets' ? 'bouquets' : 'flowers';
}

function CartIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <path d="M2 3h2l2.2 10.2a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L21 7H6.2" />
    </svg>
  );
}

function BrandIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-8 w-8" aria-hidden="true">
      <circle cx="24" cy="24" r="22" fill="#fce7f3" />
      <circle cx="24" cy="24" r="14" fill="#f9a8d4" opacity="0.35" />
      <path d="M24 13c2.8 0 5 2.2 5 5s-2.2 5-5 5-5-2.2-5-5 2.2-5 5-5z" fill="#f472b6" />
      <path d="M18.5 19c2 0 3.5 1.6 3.5 3.5S20.5 26 18.5 26 15 24.4 15 22.5 16.5 19 18.5 19z" fill="#f9a8d4" />
      <path d="M29.5 19c2 0 3.5 1.6 3.5 3.5S31.5 26 29.5 26 26 24.4 26 22.5 27.5 19 29.5 19z" fill="#f9a8d4" />
      <path d="M19 28c3.4 0 6 2.4 6 5.5S22.4 39 19 39s-6-2.4-6-5.5S15.6 28 19 28z" fill="#f9a8d4" />
      <path d="M29 28c3.4 0 6 2.4 6 5.5S32.4 39 29 39s-6-2.4-6-5.5S25.6 28 29 28z" fill="#f9a8d4" />
      <circle cx="24" cy="24" r="2.8" fill="#fb7185" />
    </svg>
  );
}

export default function ClientApp({ initialProducts, settings }) {
  const [products] = useState(initialProducts);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [maxPriceInput, setMaxPriceInput] = useState('5000');
  const [cart, setCart] = useState([]);
  const [stage, setStage] = useState('catalog');
  const [selected, setSelected] = useState(null);
  const [checkout, setCheckout] = useState({
    name: '',
    phone: '',
    orderType: 'delivery',
    city: '',
    street: '',
    building: '',
    apartment: '',
    comment: '',
    deliveryDateTime: '',
    paymentMethod: 'liqpay'
  });
  const [statusText, setStatusText] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  const filtered = useMemo(
    () =>
      products.filter((p) => {
        if (!p.isActive) return false;
        if (Number(p.stockQty ?? 0) <= 0) return false;
        if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
        if (category !== 'all' && normalizeCategory(p.category) !== category) return false;
        const maxPrice = Number(maxPriceInput);
        if (maxPriceInput !== '' && Number.isFinite(maxPrice) && p.basePrice > maxPrice) return false;
        return true;
      }),
    [products, search, category, maxPriceInput]
  );

  function addToCart(product, options) {
    const idx = cart.findIndex((i) => i.productId === product.id && JSON.stringify(i.options) === JSON.stringify(options));
    if (idx >= 0) {
      const next = [...cart];
      next[idx].qty += 1;
      setCart(next);
    } else {
      setCart([...cart, { productId: product.id, name: product.name, image: product.image, qty: 1, options, price: options.price }]);
    }
  }

  function updateQty(i, delta) {
    const next = [...cart];
    next[i].qty += delta;
    if (next[i].qty <= 0) next.splice(i, 1);
    setCart(next);
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartItemsCount = cart.reduce((s, i) => s + Number(i.qty || 0), 0);
  const orderType = checkout.orderType === 'pickup' ? 'pickup' : 'delivery';
  const deliveryPrice = orderType === 'delivery' ? Number(settings.deliveryPrice || 100) : 0;
  const total = subtotal + deliveryPrice;

  async function createOrder() {
    if (isSubmittingOrder) return;
    if (!cart.length) return alert('Кошик порожній');
    if (!checkout.name || !checkout.phone || !checkout.deliveryDateTime) return alert("Заповніть обов'язкові поля");
    if (orderType === 'delivery' && (!checkout.city || !checkout.street || !checkout.building)) return alert('Вкажіть адресу доставки');

    setIsSubmittingOrder(true);
    try {
      const payload = {
        ...checkout,
        orderType,
        deliveryDate: checkout.deliveryDateTime,
        deliveryTime: checkout.deliveryDateTime,
        items: cart,
        subtotal,
        deliveryPrice,
        total,
        telegramUserId: window?.Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString() || ''
      };
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) return alert(data.error || 'Помилка створення замовлення');

      await fetch('/api/telegram/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.order)
      });

      if (checkout.paymentMethod === 'liqpay') {
        const payRes = await fetch('/api/liqpay/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderNo: data.order.orderNo, total: data.order.total })
        });
        const pay = await payRes.json();
        if (!payRes.ok) return alert(pay.error || 'Помилка LiqPay');

        setStatusText('Переходимо до оплати LiqPay...');
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = 'https://www.liqpay.ua/api/3/checkout';
        form.innerHTML = `<input name="data" value="${pay.data}" /><input name="signature" value="${pay.signature}" />`;
        document.body.appendChild(form);
        form.submit();
        return;
      }

      setStatusText(`Замовлення прийнято. Номер: ${data.order.orderNo}. Статус: Новий`);
      setCart([]);
      setStage('done');
    } finally {
      setIsSubmittingOrder(false);
    }
  }

  if (selected) {
    return <ProductDetails product={selected} onBack={() => setSelected(null)} onAdd={addToCart} onGoCart={() => { setSelected(null); setStage('cart'); }} />;
  }

  if (stage === 'cart') {
    return (
      <div className="app-shell space-y-3">
        <h1 className="text-2xl font-semibold">Кошик</h1>
        <div className="card p-3 space-y-3">
          {cart.length === 0 && <p>Кошик порожній</p>}
          {cart.map((item, idx) => {
            const productCategory = normalizeCategory(products.find((p) => p.id === item.productId)?.category);
            const extrasText = item.options.extras.join(', ') || 'без додаткового';
            const detailsText = productCategory === 'bouquets' ? extrasText : `${item.options.flowerQty} шт, ${extrasText}`;
            const itemTotal = item.price * item.qty;
            return (
              <div className="rounded-xl border border-line p-3" key={idx}>
                <div className="flex items-start gap-3">
                  <img src={item.image} alt={item.name} className="h-16 w-16 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-neutral-500">{detailsText}</p>
                    <p className="pt-1 text-2xl font-bold leading-none">{itemTotal} грн</p>
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <button className="h-8 w-8 rounded-lg border border-line bg-white text-sm font-semibold" onClick={() => updateQty(idx, -item.qty)}>-</button>
                    <span className="min-w-5 text-center text-sm font-medium">{item.qty}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="card p-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Сума товарів</span>
            <span>{subtotal} грн</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Доставка</span>
            <span>{deliveryPrice} грн</span>
          </div>
          <div className="border-t border-line pt-2 flex items-center justify-between">
            <span className="font-semibold">До оплати</span>
            <span className="text-xl font-bold">{total} грн</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary w-1/2" onClick={() => setStage('catalog')}>Назад</button>
          <button className="btn-primary w-1/2" onClick={() => setStage('checkout')}>Оформити замовлення</button>
        </div>
      </div>
    );
  }

  if (stage === 'checkout') {
    return (
      <div className="app-shell space-y-3">
        <h1 className="text-2xl font-semibold">Оформлення замовлення</h1>
        <div className="card p-3 space-y-2">
          <p className="text-sm font-semibold">Ваші дані</p>
          <input className="field" placeholder="Ім'я" value={checkout.name} onChange={(e) => setCheckout({ ...checkout, name: e.target.value })} />
          <input className="field" placeholder="Телефон" value={checkout.phone} onChange={(e) => setCheckout({ ...checkout, phone: e.target.value })} />
        </div>
        <div className="card p-3 space-y-2">
          <p className="text-sm font-semibold">Спосіб отримання</p>
          <div className="grid grid-cols-2 gap-2">
            <button className={orderType === 'pickup' ? 'btn-primary' : 'btn-secondary'} onClick={() => setCheckout({ ...checkout, orderType: 'pickup' })}>Самовивіз</button>
            <button className={orderType === 'delivery' ? 'btn-primary' : 'btn-secondary'} onClick={() => setCheckout({ ...checkout, orderType: 'delivery' })}>Доставка</button>
          </div>
          {orderType === 'delivery' && (
            <>
              <p className="pt-1 text-sm font-semibold">Адреса доставки</p>
              <input className="field" placeholder="Місто" value={checkout.city} onChange={(e) => setCheckout({ ...checkout, city: e.target.value })} />
              <input className="field" placeholder="Вулиця" value={checkout.street} onChange={(e) => setCheckout({ ...checkout, street: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <input className="field" placeholder="Будинок" value={checkout.building} onChange={(e) => setCheckout({ ...checkout, building: e.target.value })} />
                <input className="field" placeholder="Квартира" value={checkout.apartment} onChange={(e) => setCheckout({ ...checkout, apartment: e.target.value })} />
              </div>
              <textarea className="field" placeholder="Коментар" value={checkout.comment} onChange={(e) => setCheckout({ ...checkout, comment: e.target.value })} />
            </>
          )}
        </div>
        <div className="card p-3 space-y-2">
          <p className="text-sm font-semibold">Дата та час доставки/отримання</p>
          <input className="field min-w-0 px-2 py-1.5 text-sm" type="text" placeholder="Наприклад: завтра 18:30" value={checkout.deliveryDateTime} onChange={(e) => setCheckout({ ...checkout, deliveryDateTime: e.target.value })} />
        </div>
        <div className="card p-3 space-y-2">
          <p className="text-sm font-semibold">Оплата</p>
          <div className="rounded-xl border border-line bg-white p-1">
            <div className="grid grid-cols-2 gap-1">
              <button
                className={`rounded-lg px-2 py-1.5 text-sm font-medium ${checkout.paymentMethod === 'liqpay' ? 'bg-rose text-white' : 'text-ink'}`}
                onClick={() => setCheckout({ ...checkout, paymentMethod: 'liqpay' })}
              >
                Карткою
              </button>
              <button
                className={`rounded-lg px-2 py-1.5 text-sm font-medium ${checkout.paymentMethod === 'cod' ? 'bg-rose text-white' : 'text-ink'}`}
                onClick={() => setCheckout({ ...checkout, paymentMethod: 'cod' })}
              >
                При отриманні
              </button>
            </div>
          </div>
        </div>
        <div className="card p-3">
          <p className="text-sm text-neutral-600">До оплати</p>
          <p className="text-3xl font-bold leading-none">{total} грн</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary w-1/2" onClick={() => setStage('cart')}>Назад</button>
          <button className="btn-primary w-1/2 disabled:opacity-60 disabled:cursor-not-allowed" disabled={isSubmittingOrder} onClick={createOrder}>
            {isSubmittingOrder ? 'Підтвердження...' : 'Підтвердити замовлення'}
          </button>
        </div>
      </div>
    );
  }

  if (stage === 'done') {
    return (
      <div className="app-shell space-y-3">
        <h1 className="text-xl font-semibold">{statusText || 'Замовлення оформлено'}</h1>
        <a className="btn-primary block text-center" href={settings.telegramLink} target="_blank">Написати менеджеру в Telegram</a>
        <button className="btn-secondary w-full" onClick={() => setStage('catalog')}>До каталогу</button>
      </div>
    );
  }

  return (
    <div className="app-shell space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BrandIcon />
          <h1 className="text-2xl font-semibold">Mood Flowers</h1>
        </div>
        <button className="relative rounded-xl border border-line bg-white px-3 py-2" onClick={() => setStage('cart')} aria-label="Кошик">
          <CartIcon />
          {cartItemsCount > 0 && (
            <span className="absolute -right-2 -top-2 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose px-1 text-xs font-semibold leading-none text-white">
              {cartItemsCount}
            </span>
          )}
        </button>
      </div>
      <div className="card p-3 space-y-2">
        <input className="field" placeholder="Пошук по назві" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          <select className="field" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">Категорія</option>
            <option value="flowers">Квіти</option>
            <option value="bouquets">Букети</option>
          </select>
          <input className="field" type="number" min="100" step="50" value={maxPriceInput} onChange={(e) => setMaxPriceInput(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {filtered.map((p) => (
          <div className="card p-2 h-full flex flex-col" key={p.id}>
            <img src={p.image} alt={p.name} className="aspect-square w-full rounded-xl object-cover" />
            <div className="p-2 flex h-full flex-col">
              <p className="min-h-[48px] text-[15px] font-semibold leading-6">{p.name}</p>
              <p className="text-sm text-neutral-600 min-h-[40px]">{p.shortDesc}</p>
              <div className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>В наявності</span>
              </div>
              <div className="mt-2 space-y-2">
                <span className="block text-xl font-bold leading-none">{p.basePrice} грн</span>
                <button className="btn-primary w-full rounded-2xl px-4 py-2.5 text-sm" onClick={() => setSelected(p)}>Замовити</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-sm text-neutral-600">Телефон магазину: {settings.shopPhone}</p>
    </div>
  );
}

function ProductDetails({ product, onBack, onAdd, onGoCart }) {
  const isBouquet = normalizeCategory(product.category) === 'bouquets';
  const [flowerQtyInput, setFlowerQtyInput] = useState(isBouquet ? '1' : '9');
  const [cardText, setCardText] = useState('');
  const [extras, setExtras] = useState([]);
  const [isAdded, setIsAdded] = useState(false);
  const [addMessage, setAddMessage] = useState('');
  const extrasMap = { card: 50, packaging: 120, ribbon: 40 };
  const gallery = Array.isArray(product.gallery) ? product.gallery : [];
  const [activeImage, setActiveImage] = useState(product.image);
  const stockQty = Number(product.stockQty ?? 0);
  const parsedFlowerQty = Math.floor(Number(flowerQtyInput));
  const flowerQty = isBouquet ? 1 : parsedFlowerQty;
  const hasValidFlowerQty = isBouquet || (flowerQtyInput !== '' && Number.isFinite(parsedFlowerQty) && parsedFlowerQty >= 1);

  const effectiveExtras = isBouquet ? extras.filter((e) => e === 'card') : extras;
  const finalPrice = Math.max(product.basePrice * flowerQty + effectiveExtras.reduce((s, e) => s + (extrasMap[e] || 0), 0), 0);

  function toggleExtra(key) {
    setExtras((prev) => {
      if (key === 'packaging' || key === 'ribbon') {
        const other = key === 'packaging' ? 'ribbon' : 'packaging';
        const hasCurrent = prev.includes(key);
        const withoutBoth = prev.filter((x) => x !== key && x !== other);
        return hasCurrent ? withoutBoth : [...withoutBoth, key];
      }
      return prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key];
    });
  }

  function addCurrentProduct() {
    if (stockQty <= 0) {
      alert('Товар тимчасово відсутній');
      return;
    }
    if (!hasValidFlowerQty) {
      alert('Вкажіть коректну кількість');
      return;
    }
    if (stockQty > 0 && flowerQty > stockQty) {
      alert('Вибрана кількість перевищує наявність');
      return;
    }
    if (finalPrice < MIN_ORDER_TOTAL) {
      alert(`Мінімальна сума замовлення ${MIN_ORDER_TOTAL} грн`);
      return;
    }

    onAdd(product, {
      flowerQty,
      extras: effectiveExtras,
      cardText,
      price: finalPrice
    });
    setIsAdded(true);
    setAddMessage('Товар додано в кошик');
    setTimeout(() => setIsAdded(false), 1000);
    setTimeout(() => setAddMessage(''), 1600);
  }

  return (
    <div className="app-shell space-y-3">
      <button className="text-sm font-medium text-neutral-700" onClick={onBack}>← Назад</button>
      <div className="card p-3 space-y-2">
        <img src={activeImage} alt={product.name} className="aspect-square w-full rounded-xl object-cover" />
        <div className="grid grid-cols-3 gap-2">
          {[product.image, ...gallery].map((g, i) => (
            <button key={i} className={`overflow-hidden rounded-lg border ${activeImage === g ? 'border-rose' : 'border-line'}`} onClick={() => setActiveImage(g)}>
              <img src={g} alt="photo" className="h-20 w-full object-cover" />
            </button>
          ))}
        </div>
        <h2 className="text-xl font-semibold">{product.name}</h2>
        <p className="text-sm text-neutral-600">{product.fullDesc}</p>
        <div className="inline-flex w-fit items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
          ● В наявності ({stockQty}{isBouquet ? '' : ' шт'})
        </div>

        {!isBouquet && (
          <label className="mt-2 block text-sm">
            Кількість
            <input
              className="field mt-1"
              type="number"
              min={1}
              max={stockQty > 0 ? stockQty : undefined}
              value={flowerQtyInput}
              onChange={(e) => setFlowerQtyInput(e.target.value)}
            />
          </label>
        )}

        <div className="space-y-2">
          <p className="text-sm font-medium">Додатково</p>
          {!isBouquet && (
            <>
              <label className="block text-sm"><input type="checkbox" checked={effectiveExtras.includes('packaging')} onChange={() => toggleExtra('packaging')} /> Упакування - 120 грн</label>
              <label className="block text-sm"><input type="checkbox" checked={effectiveExtras.includes('ribbon')} onChange={() => toggleExtra('ribbon')} /> Стрічка - 40 грн</label>
            </>
          )}
          <label className="block text-sm"><input type="checkbox" checked={effectiveExtras.includes('card')} onChange={() => toggleExtra('card')} /> Листівка - 50 грн</label>
        </div>

        {effectiveExtras.includes('card') && (
          <textarea className="field" placeholder="Текст для листівки" value={cardText} onChange={(e) => setCardText(e.target.value)} />
        )}
        <p className="text-3xl font-bold leading-none">{finalPrice} грн</p>
        <p className="text-sm text-neutral-600">Мінімальне замовлення: {MIN_ORDER_TOTAL} грн</p>
        {addMessage && <p className="text-sm font-medium text-emerald-700">{addMessage}</p>}
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-primary inline-flex items-center justify-center gap-2" onClick={addCurrentProduct}>
            {isAdded ? '✓ Додано' : (<><CartIcon className="h-4 w-4" /> В кошик</>)}
          </button>
          <button className="btn-secondary" onClick={onGoCart}>Перейти в кошик</button>
        </div>
      </div>
    </div>
  );
}
