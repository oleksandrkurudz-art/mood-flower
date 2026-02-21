import { NextResponse } from 'next/server';

export async function POST(request) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!token || !chatId) return NextResponse.json({ ok: false, skipped: true });
  const body = await request.json();
  const text = [`Нове замовлення ${body.orderNo}`, `Ім'я: ${body.customerName || '-'}`, `Телефон: ${body.phone || '-'}`, `Сума: ${body.total || 0} грн`].join('\n');
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, text }) });
  return NextResponse.json({ ok: true });
}
