"use client";

import { useState } from 'react';

export default function AdminLoginPage() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    const res = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ login, password })
    });
    if (!res.ok) { setError('Невірний логін або пароль'); return; }
    window.location.href = '/admin/orders';
  }

  return (
    <div className="mx-auto mt-10 max-w-sm">
      <h1 className="mb-4 text-2xl font-semibold">Admin Login</h1>
      <form className="card space-y-3 p-4" onSubmit={submit}>
        <input className="field" placeholder="Логін" value={login} onChange={(e) => setLogin(e.target.value)} />
        <input className="field" type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="text-red-600">{error}</p>}
        <button className="btn-primary w-full" type="submit">Увійти</button>
      </form>
    </div>
  );
}
