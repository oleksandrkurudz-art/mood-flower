"use client";

import { useEffect, useState } from 'react';

const empty = { name: '', shortDesc: '', fullDesc: '', basePrice: 1000, image: '', gallery: '', flowerType: 'mix', color: 'mix', category: 'bouquet', isActive: true };

export default function AdminProductsPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  async function load() {
    const res = await fetch('/api/products');
    if (!res.ok) {
      setItems([]);
      alert('Не вдалося завантажити товари');
      return;
    }
    setItems(await res.json());
  }
  async function save(e) {
    e.preventDefault();
    const payload = { ...form, gallery: form.gallery ? form.gallery.split(',').map((x) => x.trim()) : [] };
    const method = form.id ? 'PATCH' : 'POST';
    await fetch('/api/products', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    setForm(empty); load();
  }
  async function remove(id) { await fetch('/api/products', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }); load(); }
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">Товари</h1>
      <form className="card grid gap-2 p-3" onSubmit={save}>
        <input className="field" placeholder="Назва" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="field" placeholder="Короткий опис" value={form.shortDesc} onChange={(e) => setForm({ ...form, shortDesc: e.target.value })} />
        <textarea className="field" placeholder="Повний опис" value={form.fullDesc} onChange={(e) => setForm({ ...form, fullDesc: e.target.value })} />
        <input className="field" type="number" placeholder="Ціна" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: Number(e.target.value || 0) })} />
        <input className="field" placeholder="Фото URL" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
        <input className="field" placeholder="Галерея URL через кому" value={form.gallery} onChange={(e) => setForm({ ...form, gallery: e.target.value })} />
        <div className="grid grid-cols-3 gap-2">
          <input className="field" placeholder="Категорія" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <input className="field" placeholder="Колір" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
          <input className="field" placeholder="Тип квітів" value={form.flowerType} onChange={(e) => setForm({ ...form, flowerType: e.target.value })} />
        </div>
        <label><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Активний</label>
        <button className="btn-primary" type="submit">Зберегти товар</button>
      </form>
      <div className="grid gap-2">
        {items.map((i) => (
          <div className="card p-3" key={i.id}>
            <p className="font-semibold">{i.name}</p>
            <p>{i.basePrice} грн</p>
            <div className="mt-2 flex gap-2">
              <button className="btn-secondary" onClick={() => setForm({ ...i, gallery: (i.gallery || []).join(',') })}>Редагувати</button>
              <button className="btn-secondary" onClick={() => remove(i.id)}>Видалити</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
