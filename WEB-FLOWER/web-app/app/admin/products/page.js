"use client";

import { useEffect, useState } from 'react';

const empty = { name: '', shortDesc: '', fullDesc: '', basePrice: 1000, image: '', gallery: '', flowerType: 'mix', color: 'mix', category: 'bouquet', isActive: true };

function parseGalleryInput(value) {
  return String(value || '')
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);
}

export default function AdminProductsPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);

  async function fileToDataUrl(file) {
    const rawDataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    // Resize/compress on client to keep payloads manageable.
    const img = new Image();
    img.src = rawDataUrl;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    const maxWidth = 900;
    const ratio = img.width > maxWidth ? maxWidth / img.width : 1;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * ratio);
    canvas.height = Math.round(img.height * ratio);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.72);
  }

  async function onMainImageFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setForm((prev) => ({ ...prev, image: dataUrl }));
  }

  async function onGalleryFilesChange(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const dataUrls = await Promise.all(files.map(fileToDataUrl));
    setForm((prev) => {
      const existing = parseGalleryInput(prev.gallery);
      return { ...prev, gallery: [...existing, ...dataUrls].join('\n') };
    });
  }

  async function load() {
    const res = await fetch('/api/products?includeInactive=1', { cache: 'no-store' });
    if (!res.ok) {
      setItems([]);
      alert('Не вдалося завантажити товари');
      return;
    }
    setItems(await res.json());
  }
  async function save(e) {
    e.preventDefault();
    const payload = { ...form, gallery: parseGalleryInput(form.gallery) };
    const method = form.id ? 'PATCH' : 'POST';
    const res = await fetch('/api/products', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) {
      let message = 'Не вдалося зберегти товар';
      try {
        const err = await res.json();
        if (err?.error) message += `: ${err.error}`;
      } catch {}
      alert(message + '. Спробуйте менше/легше фото або вставте URL.');
      return;
    }
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
        <label className="text-sm">
          Завантажити головне фото з галереї
          <input className="field mt-1" type="file" accept="image/*" onChange={onMainImageFileChange} />
        </label>
        <textarea className="field" rows={4} placeholder="Галерея: 1 фото = 1 рядок" value={form.gallery} onChange={(e) => setForm({ ...form, gallery: e.target.value })} />
        <label className="text-sm">
          Додати фото в галерею (можна кілька)
          <input className="field mt-1" type="file" accept="image/*" multiple onChange={onGalleryFilesChange} />
        </label>
        {form.image ? <img src={form.image} alt="preview" className="h-28 w-28 rounded-lg object-cover" /> : null}
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
              <button className="btn-secondary" onClick={() => setForm({ ...i, gallery: (i.gallery || []).join('\n') })}>Редагувати</button>
              <button className="btn-secondary" onClick={() => remove(i.id)}>Видалити</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
