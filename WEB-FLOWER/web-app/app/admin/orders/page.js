"use client";

import { useEffect, useState } from 'react';

const statusOptions = [
  { value: 'new', label: '🟡 Нове', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'in_work', label: '🔵 В роботі', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'ready', label: '🟢 Готове', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'delivered', label: '🟢 Виконано', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'cancelled', label: '🔴 Скасовано', cls: 'bg-rose-50 text-rose-700 border-rose-200' }
];

const extrasLabels = {
  packaging: 'Упакування',
  ribbon: 'Стрічка',
  card: 'Листівка'
};

function statusMeta(status) {
  return statusOptions.find((s) => s.value === status) || statusOptions[0];
}

function orderTypeLabel(value) {
  return value === 'pickup' ? 'Самовивіз' : 'Доставка';
}

function paymentLabel(value) {
  return value === 'liqpay' ? 'Карткою' : 'При отриманні';
}

function readItems(order) {
  if (Array.isArray(order.items)) return order.items;
  try {
    const parsed = JSON.parse(order.itemsJson || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  async function load() {
    const res = await fetch('/api/orders');
    setOrders(await res.json());
  }

  async function setStatus(id, status) {
    await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    load();
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">Замовлення</h1>
      <div className="space-y-2">
        {orders.map((o) => {
          const current = statusMeta(o.status);
          const items = readItems(o);
          const isOpen = expandedId === o.id;
          const createdAt = new Date(o.createdAt).toLocaleString('uk-UA', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          });

          return (
            <div key={o.id} className="card p-3">
              <button
                className="w-full space-y-2 text-left"
                onClick={() => setExpandedId(isOpen ? null : o.id)}
                type="button"
              >
                <div className="space-y-1">
                  <p className="text-base font-semibold">{o.customerName || 'Без імені'}</p>
                  <p className="text-sm text-neutral-600">{o.phone}</p>
                </div>
                <div className="flex items-end justify-between">
                  <p className="text-2xl font-bold leading-none">{o.total} грн</p>
                  <p className="text-xs text-neutral-500">{createdAt}</p>
                </div>
                <p className="text-xs text-neutral-500">Натисніть, щоб {isOpen ? 'сховати' : 'переглянути'} деталі</p>
              </button>

              <div className="mt-2 space-y-1">
                <p className="text-xs text-neutral-500">Статус</p>
                <select
                  className={`w-full rounded-xl border px-3 py-2 text-sm font-medium ${current.cls}`}
                  value={o.status}
                  onChange={(e) => setStatus(o.id, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                >
                  {statusOptions.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              {isOpen && (
                <div className="mt-3 space-y-3 border-t border-line pt-3">
                  <div className="text-sm space-y-1">
                    <p><span className="text-neutral-500">№ замовлення:</span> {o.orderNo}</p>
                    <p><span className="text-neutral-500">Спосіб отримання:</span> {orderTypeLabel(o.orderType)}</p>
                    <p><span className="text-neutral-500">Оплата:</span> {paymentLabel(o.paymentMethod)}</p>
                    <p><span className="text-neutral-500">Дата/час:</span> {o.deliveryDate}</p>
                    {o.orderType === 'delivery' && (
                      <p>
                        <span className="text-neutral-500">Адреса:</span>{' '}
                        {[o.city, o.street, o.building, o.apartment].filter(Boolean).join(', ') || 'не вказано'}
                      </p>
                    )}
                    {o.comment ? <p><span className="text-neutral-500">Коментар:</span> {o.comment}</p> : null}
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Склад замовлення</p>
                    {items.map((item, idx) => {
                      const extras = Array.isArray(item?.options?.extras) ? item.options.extras : [];
                      const extrasText = extras.length ? extras.map((e) => extrasLabels[e] || e).join(', ') : 'без додаткового';
                      return (
                        <div key={idx} className="rounded-lg border border-line p-2 text-sm space-y-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-neutral-600">Кількість позицій: {item.qty ?? 1}</p>
                          {item?.options?.flowerQty ? <p className="text-neutral-600">Кількість квітів: {item.options.flowerQty} шт</p> : null}
                          <p className="text-neutral-600">Додатково: {extrasText}</p>
                          {item?.options?.cardText ? <p className="text-neutral-600">Текст листівки: {item.options.cardText}</p> : null}
                          <p className="font-semibold">{(Number(item.price || 0) * Number(item.qty || 1))} грн</p>
                        </div>
                      );
                    })}
                    {!items.length && (
                      <p className="text-sm text-neutral-500">Склад замовлення недоступний</p>
                    )}
                  </div>

                  <div className="rounded-lg border border-line p-2 text-sm space-y-1">
                    <div className="flex justify-between"><span>Сума товарів</span><span>{o.subtotal} грн</span></div>
                    <div className="flex justify-between"><span>Доставка</span><span>{o.deliveryPrice} грн</span></div>
                    <div className="flex justify-between border-t border-line pt-1 font-semibold"><span>До оплати</span><span>{o.total} грн</span></div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {!orders.length && (
          <div className="card p-3 text-sm text-neutral-600">Замовлень ще немає</div>
        )}
      </div>
    </div>
  );
}
