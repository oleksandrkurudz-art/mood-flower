"use client";

import { useEffect, useState } from 'react';

const statusOptions = [
  { value: 'new', label: '🟡 Нове', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'in_work', label: '🔵 В роботі', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'ready', label: '🟢 Готове', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'delivered', label: '🟢 Виконано', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'cancelled', label: '🔴 Скасовано', cls: 'bg-rose-50 text-rose-700 border-rose-200' }
];

function statusMeta(status) {
  return statusOptions.find((s) => s.value === status) || statusOptions[0];
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  async function load() { const res = await fetch('/api/orders'); setOrders(await res.json()); }
  async function setStatus(id, status) {
    await fetch(`/api/orders/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    load();
  }
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">Замовлення</h1>
      <div className="space-y-2">
        {orders.map((o) => {
          const current = statusMeta(o.status);
          return (
            <div key={o.id} className="card p-3 space-y-2">
              <div className="space-y-1">
                <p className="text-base font-semibold">{o.customerName || 'Без імені'}</p>
                <p className="text-sm text-neutral-600">{o.phone}</p>
              </div>

              <div className="flex items-end justify-between">
                <p className="text-2xl font-bold leading-none">{o.total} грн</p>
                <p className="text-xs text-neutral-500">{new Date(o.createdAt).toLocaleString('uk-UA', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-neutral-500">Статус</p>
                <select
                  className={`w-full rounded-xl border px-3 py-2 text-sm font-medium ${current.cls}`}
                  value={o.status}
                  onChange={(e) => setStatus(o.id, e.target.value)}
                >
                  {statusOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
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
