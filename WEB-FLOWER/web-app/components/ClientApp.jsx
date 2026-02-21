"use client";

import { useMemo, useState } from 'react';

const MIN_ORDER_TOTAL = 700;

function normalizeCategory(value) {
  return value === 'bouquet' || value === 'bouquets' ? 'bouquets' : 'flowers';
}

export default function ClientApp({ initialProducts, settings }) {
  const [products] = useState(initialProducts);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [color, setColor] = useState('all');
  const [maxPrice, setMaxPrice] = useState(5000);
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
    deliveryDate: '',
    deliveryTime: '',
    paymentMethod: 'liqpay'
  });
  const [statusText, setStatusText] = useState('');

  const filtered = useMemo(
    () =>
      products.filter((p) => {
        if (!p.isActive) return false;
        if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
        if (category !== 'all' && normalizeCategory(p.category) !== category) return false;
        if (color !== 'all' && p.color !== color) return false;
        if (p.basePrice > maxPrice) return false;
        return true;
      }),
    [products, search, category, color, maxPrice]
  );

  function addToCart(product, options) {
    const idx = cart.findIndex((i) => i.productId === product.id && JSON.stringify(i.options) === JSON.stringify(options));
    if (idx >= 0) {
      const next = [...cart];
      next[idx].qty += 1;
      setCart(next);
    } else {
      setCart([...cart, { productId: product.id, name: product.name, qty: 1, options, price: options.price }]);
    }
    setStage('catalog');
    setSelected(null);
  }

  function updateQty(i, delta) {
    const next = [...cart];
    next[i].qty += delta;
    if (next[i].qty <= 0) next.splice(i, 1);
    setCart(next);
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const deliveryPrice = checkout.orderType === 'delivery' ? Number(settings.deliveryPrice || 100) : 0;
  const total = subtotal + deliveryPrice;

  async function createOrder() {
    if (!cart.length) return alert('Кошик порожній');
    if (!checkout.name || !checkout.phone || !checkout.deliveryDate || !checkout.deliveryTime) return alert("Заповніть обов'язкові поля");
    if (checkout.orderType === 'delivery' && (!checkout.city || !checkout.street || !checkout.building)) return alert('Вкажіть адресу доставки');

    const payload = {
      ...checkout,
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
  }

  if (selected) {
    return <ProductDetails product={selected} onBack={() => setSelected(null)} onAdd={addToCart} />;
  }

  if (stage === 'cart') {
    return (
      <div className="app-shell space-y-3">
        <h1 className="text-2xl font-semibold">Кошик</h1>
        <div className="card p-3 space-y-2">
          {cart.length === 0 && <p>Кошик порожній</p>}
          {cart.map((item, idx) => (
            <div className="flex items-center justify-between" key={idx}>
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-neutral-500">
                  {item.options.flowerQty} шт, {item.options.extras.join(', ') || 'без додаткового'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button className="btn-secondary" onClick={() => updateQty(idx, -1)}>-</button>
                <span>{item.qty}</span>
                <button className="btn-secondary" onClick={() => updateQty(idx, 1)}>+</button>
              </div>
            </div>
          ))}
          <p>Сума товарів: {subtotal} грн</p>
          <p>Доставка: {deliveryPrice} грн</p>
          <p className="font-semibold">Загальна сума: {total} грн</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary w-1/2" onClick={() => setStage('catalog')}>Назад</button>
          <button className="btn-primary w-1/2" onClick={() => setStage('checkout')}>Оформити</button>
        </div>
      </div>
    );
  }

  if (stage === 'checkout') {
    return (
      <div className="app-shell space-y-3">
        <h1 className="text-2xl font-semibold">Оформлення замовлення</h1>
        <div className="card p-3 space-y-2">
          <input className="field" placeholder="Ім'я" value={checkout.name} onChange={(e) => setCheckout({ ...checkout, name: e.target.value })} />
          <input className="field" placeholder="Телефон" value={checkout.phone} onChange={(e) => setCheckout({ ...checkout, phone: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <button className={checkout.orderType === 'pickup' ? 'btn-primary' : 'btn-secondary'} onClick={() => setCheckout({ ...checkout, orderType: 'pickup' })}>Самовивіз</button>
            <button className={checkout.orderType === 'delivery' ? 'btn-primary' : 'btn-secondary'} onClick={() => setCheckout({ ...checkout, orderType: 'delivery' })}>Доставка</button>
          </div>
          {checkout.orderType === 'delivery' && (
            <>
              <input className="field" placeholder="Місто" value={checkout.city} onChange={(e) => setCheckout({ ...checkout, city: e.target.value })} />
              <input className="field" placeholder="Вулиця" value={checkout.street} onChange={(e) => setCheckout({ ...checkout, street: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <input className="field" placeholder="Будинок" value={checkout.building} onChange={(e) => setCheckout({ ...checkout, building: e.target.value })} />
                <input className="field" placeholder="Квартира" value={checkout.apartment} onChange={(e) => setCheckout({ ...checkout, apartment: e.target.value })} />
              </div>
              <textarea className="field" placeholder="Коментар" value={checkout.comment} onChange={(e) => setCheckout({ ...checkout, comment: e.target.value })} />
            </>
          )}
          <div className="grid grid-cols-2 gap-2">
            <input className="field" type="date" value={checkout.deliveryDate} onChange={(e) => setCheckout({ ...checkout, deliveryDate: e.target.value })} />
            <input className="field" type="time" value={checkout.deliveryTime} onChange={(e) => setCheckout({ ...checkout, deliveryTime: e.target.value })} />
          </div>
          <button className={checkout.paymentMethod === 'liqpay' ? 'btn-primary' : 'btn-secondary'} onClick={() => setCheckout({ ...checkout, paymentMethod: 'liqpay' })}>Оплатити через LiqPay</button>
          <button className={checkout.paymentMethod === 'cod' ? 'btn-primary' : 'btn-secondary'} onClick={() => setCheckout({ ...checkout, paymentMethod: 'cod' })}>Оплата при отриманні</button>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary w-1/2" onClick={() => setStage('cart')}>Назад</button>
          <button className="btn-primary w-1/2" onClick={createOrder}>Підтвердити</button>
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
      <h1 className="text-2xl font-semibold">Mood Flowers</h1>
      <div className="card p-3 space-y-2">
        <input className="field" placeholder="Пошук по назві" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="grid grid-cols-3 gap-2">
          <select className="field" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">Категорія</option>
            <option value="flowers">Квіти</option>
            <option value="bouquets">Букети</option>
          </select>
          <select className="field" value={color} onChange={(e) => setColor(e.target.value)}>
            <option value="all">Колір</option>
            <option value="red">Червоні</option>
            <option value="white">Білі</option>
            <option value="pink">Рожеві</option>
            <option value="mix">Мікс</option>
          </select>
          <input className="field" type="number" min="100" step="50" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value || 5000))} />
        </div>
      </div>
      <div className="space-y-2">
        {filtered.map((p) => (
          <div className="card p-2" key={p.id}>
            <img src={p.image} alt={p.name} className="h-44 w-full rounded-xl object-cover" />
            <div className="p-2">
              <p className="font-semibold">{p.name}</p>
              <p className="text-sm text-neutral-600">{p.shortDesc}</p>
              <p className="text-sm text-neutral-600">В наявності: {p.stockQty ?? 0} шт</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="font-semibold">{p.basePrice} грн</span>
                <div className="flex gap-2">
                  <button className="btn-secondary" onClick={() => setSelected(p)}>Детальніше</button>
                  <button className="btn-primary" onClick={() => setSelected(p)}>Замовити</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button className="btn-primary w-full" onClick={() => setStage('cart')}>Кошик ({cart.length})</button>
      <p className="text-sm text-neutral-600">Телефон магазину: {settings.shopPhone}</p>
    </div>
  );
}

function ProductDetails({ product, onBack, onAdd }) {
  const [flowerQty, setFlowerQty] = useState(9);
  const [cardText, setCardText] = useState('');
  const [extras, setExtras] = useState([]);
  const extrasMap = { card: 50, packaging: 120, ribbon: 40 };
  const gallery = Array.isArray(product.gallery) ? product.gallery : [];
  const stockQty = Number(product.stockQty ?? 0);

  const finalPrice = Math.max(product.basePrice * flowerQty + extras.reduce((s, e) => s + (extrasMap[e] || 0), 0), 0);

  function toggleExtra(key) {
    setExtras((prev) => (prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]));
  }

  function setTemplateQty(value) {
    if (stockQty > 0) setFlowerQty(Math.min(value, stockQty));
    else setFlowerQty(value);
  }

  function addCurrentProduct() {
    if (stockQty <= 0) {
      alert('Товар тимчасово відсутній');
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
      extras,
      cardText,
      price: finalPrice
    });
  }

  return (
    <div className="app-shell space-y-3">
      <button className="btn-secondary" onClick={onBack}>Назад</button>
      <div className="card p-3 space-y-2">
        <img src={product.image} alt={product.name} className="h-56 w-full rounded-xl object-cover" />
        <div className="grid grid-cols-3 gap-2">{gallery.map((g, i) => <img key={i} src={g} alt="photo" className="h-20 w-full rounded-lg object-cover" />)}</div>
        <h2 className="text-xl font-semibold">{product.name}</h2>
        <p className="text-sm text-neutral-600">{product.fullDesc}</p>
        <p className="text-sm text-neutral-600">В наявності: {stockQty} шт</p>

        <p className="text-sm font-medium">Швидкий вибір кількості:</p>
        <div className="grid grid-cols-3 gap-2">
          <button className="btn-secondary" onClick={() => setTemplateQty(9)}>Невеликий (9)</button>
          <button className="btn-secondary" onClick={() => setTemplateQty(15)}>Середній (15)</button>
          <button className="btn-secondary" onClick={() => setTemplateQty(25)}>Великий (25)</button>
        </div>

        <label className="text-sm">
          Кількість квітів
          <input
            className="field mt-1"
            type="number"
            min={1}
            max={stockQty > 0 ? stockQty : undefined}
            value={flowerQty}
            onChange={(e) => {
              const next = Math.max(Number(e.target.value || 1), 1);
              setFlowerQty(stockQty > 0 ? Math.min(next, stockQty) : next);
            }}
          />
        </label>

        <label><input type="checkbox" onChange={() => toggleExtra('packaging')} /> Упакування (+120 грн)</label>
        <label><input type="checkbox" onChange={() => toggleExtra('ribbon')} /> Стрічка (+40 грн)</label>
        <label><input type="checkbox" onChange={() => toggleExtra('card')} /> Листівка (+50 грн)</label>

        <textarea className="field" placeholder="Текст для листівки" value={cardText} onChange={(e) => setCardText(e.target.value)} />
        <p className="font-semibold">Ціна: {finalPrice} грн</p>
        <p className="text-sm text-neutral-600">Мінімальна сума замовлення: {MIN_ORDER_TOTAL} грн</p>
        <button className="btn-primary" onClick={addCurrentProduct}>Додати в кошик</button>
      </div>
    </div>
  );
}
