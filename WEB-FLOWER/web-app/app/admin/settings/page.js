"use client";

import { useEffect, useState } from 'react';

export default function AdminSettingsPage() {
  const [form, setForm] = useState({ shopPhone: '', telegramLink: '', shopAddress: '', deliveryPrice: 100 });
  async function load() { const res = await fetch('/api/settings'); setForm(await res.json()); }
  async function save(e) {
    e.preventDefault();
    await fetch('/api/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    alert('Збережено');
  }
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">Налаштування</h1>
      <form className="card grid gap-2 p-3" onSubmit={save}>
        <input className="field" placeholder="Телефон магазину" value={form.shopPhone || ''} onChange={(e) => setForm({ ...form, shopPhone: e.target.value })} />
        <input className="field" placeholder="Telegram посилання" value={form.telegramLink || ''} onChange={(e) => setForm({ ...form, telegramLink: e.target.value })} />
        <input className="field" placeholder="Адреса магазину" value={form.shopAddress || ''} onChange={(e) => setForm({ ...form, shopAddress: e.target.value })} />
        <input className="field" type="number" placeholder="Ціна доставки" value={form.deliveryPrice || 100} onChange={(e) => setForm({ ...form, deliveryPrice: Number(e.target.value || 0) })} />
        <button className="btn-primary" type="submit">Зберегти</button>
      </form>
    </div>
  );
}
