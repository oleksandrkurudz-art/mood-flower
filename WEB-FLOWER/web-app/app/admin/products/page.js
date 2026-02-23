"use client";

import { useEffect, useRef, useState } from 'react';

const empty = {
  id: null,
  name: '',
  shortDesc: '',
  fullDesc: '',
  basePrice: '1000',
  stockQty: '0',
  image: '',
  gallery: '',
  flowerType: 'other',
  color: 'mix',
  category: 'flowers',
  isActive: true
};

function parseGalleryInput(value) {
  return String(value || '')
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function normalizeGalleryForForm(rawGallery) {
  if (Array.isArray(rawGallery)) return rawGallery.join('\n');
  if (typeof rawGallery === 'string') {
    try {
      const parsed = JSON.parse(rawGallery);
      if (Array.isArray(parsed)) return parsed.join('\n');
    } catch {}
    return rawGallery;
  }
  return '';
}

function normalizeCategory(value) {
  return value === 'bouquet' || value === 'bouquets' ? 'bouquets' : 'flowers';
}

export default function AdminProductsPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [showForm, setShowForm] = useState(false);
  const mainFileRef = useRef(null);
  const galleryFilesRef = useRef(null);
  const isBouquet = normalizeCategory(form.category) === 'bouquets';

  async function fileToDataUrl(file) {
    const rawDataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

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

  function resetForm() {
    setForm(empty);
    if (mainFileRef.current) mainFileRef.current.value = '';
    if (galleryFilesRef.current) galleryFilesRef.current.value = '';
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
    const payload = {
      ...form,
      stockQty: isBouquet ? 1 : Math.max(Number(form.stockQty || 0), 0),
      category: normalizeCategory(form.category),
      flowerType: 'other',
      gallery: parseGalleryInput(form.gallery)
    };
    const method = form.id ? 'PATCH' : 'POST';
    const res = await fetch('/api/products', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      let message = 'Не вдалося зберегти товар';
      try {
        const err = await res.json();
        if (err?.error) message += `: ${err.error}`;
      } catch {}
      alert(message + '. Спробуйте менше/легше фото.');
      return;
    }
    resetForm();
    setShowForm(false);
    load();
  }

  async function remove(id) {
    await fetch('/api/products', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    if (form.id === id) {
      resetForm();
      setShowForm(false);
    }
    load();
  }

  function startCreate() {
    resetForm();
    setShowForm(true);
  }

  function edit(item) {
    setForm({
      ...empty,
      ...item,
      category: normalizeCategory(item.category),
      basePrice: String(item.basePrice ?? ''),
      stockQty: String(item.stockQty ?? 0),
      gallery: normalizeGalleryForForm(item.gallery)
    });
    if (mainFileRef.current) mainFileRef.current.value = '';
    if (galleryFilesRef.current) galleryFilesRef.current.value = '';
    setShowForm(true);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Товари</h1>
        <button className="btn-primary" type="button" onClick={startCreate}>+ Додати товар</button>
      </div>

      {showForm && (
        <form className="card space-y-3 p-3" onSubmit={save}>
          <div className="space-y-2">
            <p className="text-sm font-semibold">Основне</p>
            <input className="field" placeholder="Назва" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <input className="field" placeholder="Короткий опис" value={form.shortDesc} onChange={(e) => setForm({ ...form, shortDesc: e.target.value })} />
            <textarea className="field" placeholder="Повний опис" value={form.fullDesc} onChange={(e) => setForm({ ...form, fullDesc: e.target.value })} />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">Ціна і склад</p>
            <div className="grid grid-cols-2 gap-2">
              <input className="field" type="number" min="1" placeholder="Ціна" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} />
              {!isBouquet ? (
                <input className="field" type="number" min="0" placeholder="Кількість" value={form.stockQty} onChange={(e) => setForm({ ...form, stockQty: e.target.value })} />
              ) : (
                <div className="field flex items-center text-sm text-neutral-600">Для букетів кількість: 1</div>
              )}
            </div>
            <select className="field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value, stockQty: e.target.value === 'bouquets' ? 1 : form.stockQty })}>
              <option value="flowers">Квіти</option>
              <option value="bouquets">Букети</option>
            </select>
            <label className="text-sm"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Активний</label>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">Фото</p>
            <p className="text-sm text-neutral-600">Головне фото</p>
            <input ref={mainFileRef} className="field" type="file" accept="image/*" onChange={onMainImageFileChange} />
            {form.image ? <img src={form.image} alt="preview" className="h-28 w-28 rounded-lg object-cover" /> : null}
            <p className="text-sm text-neutral-600">Галерея</p>
            <input ref={galleryFilesRef} className="field" type="file" accept="image/*" multiple onChange={onGalleryFilesChange} />
            <textarea className="field" rows={3} placeholder="Додатково: 1 фото = 1 рядок (за потреби)" value={form.gallery} onChange={(e) => setForm({ ...form, gallery: e.target.value })} />
          </div>

          <div className="space-y-1">
            <button className="btn-primary w-full" type="submit">{form.id ? 'Зберегти зміни' : 'Зберегти товар'}</button>
            <button className="text-sm text-neutral-500 underline" type="button" onClick={resetForm}>Очистити форму</button>
          </div>
        </form>
      )}

      <div className="grid gap-2">
        {items.map((i) => (
          <div className="card p-3" key={i.id}>
            <div className="flex items-start gap-3">
              <img src={i.image} alt={i.name} className="h-16 w-16 rounded-lg object-cover" />
              <div className="min-w-0 flex-1 space-y-1">
                <p className="font-semibold">{i.name}</p>
                <p className="text-sm">{i.basePrice} грн</p>
                <p className={`inline-flex rounded-full px-2 py-0.5 text-xs ${i.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-600'}`}>
                  {i.isActive ? 'Активний ✅' : 'Неактивний'}
                </p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button className="btn-secondary" onClick={() => edit(i)}>Редагувати</button>
              <button className="btn-secondary" onClick={() => remove(i.id)}>Видалити</button>
            </div>
          </div>
        ))}
        {!items.length && (
          <div className="card p-3 text-sm text-neutral-600">Товарів ще немає</div>
        )}
      </div>
    </div>
  );
}
