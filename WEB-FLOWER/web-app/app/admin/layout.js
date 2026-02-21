export default function AdminLayout({ children }) {
  return (
    <div className="mx-auto max-w-5xl p-4 space-y-3">
      <nav className="flex gap-2">
        <a className="btn-secondary" href="/admin/orders">Замовлення</a>
        <a className="btn-secondary" href="/admin/products">Товари</a>
        <a className="btn-secondary" href="/admin/settings">Налаштування</a>
        <form action="/api/auth/logout" method="post"><button className="btn-secondary" type="submit">Вийти</button></form>
      </nav>
      {children}
    </div>
  );
}
