"use client";

import { useEffect, useState } from 'react';

const statuses = ['new', 'in_work', 'ready', 'delivered', 'cancelled'];

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
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr><th>№</th><th>Ім'я</th><th>Телефон</th><th>Сума</th><th>Статус</th><th>Дата</th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-line">
                <td>{o.orderNo}</td><td>{o.customerName}</td><td>{o.phone}</td><td>{o.total} грн</td>
                <td><select className="field" value={o.status} onChange={(e) => setStatus(o.id, e.target.value)}>{statuses.map((s) => <option key={s} value={s}>{s}</option>)}</select></td>
                <td>{new Date(o.createdAt).toLocaleString('uk-UA')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
