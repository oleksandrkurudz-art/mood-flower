import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrderNo } from '@/lib/utils';

export async function GET() {
  const rows = await prisma.order.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(rows);
}

export async function POST(request) {
  const body = await request.json();
  if (!body.name || !body.phone || !body.deliveryDate || !body.deliveryTime || !Array.isArray(body.items) || !body.items.length) {
    return NextResponse.json({ error: 'invalid payload' }, { status: 400 });
  }

  const order = await prisma.order.create({
    data: {
      orderNo: getOrderNo(),
      telegramUserId: body.telegramUserId || '',
      customerName: body.name,
      phone: body.phone,
      orderType: body.orderType || 'delivery',
      city: body.city || '',
      street: body.street || '',
      building: body.building || '',
      apartment: body.apartment || '',
      comment: body.comment || '',
      deliveryDate: body.deliveryDate,
      deliveryTime: body.deliveryTime,
      paymentMethod: body.paymentMethod || 'cod',
      paymentStatus: body.paymentMethod === 'liqpay' ? 'pending' : 'unpaid',
      status: 'new',
      itemsJson: JSON.stringify(body.items),
      subtotal: Number(body.subtotal || 0),
      deliveryPrice: Number(body.deliveryPrice || 0),
      total: Number(body.total || 0),
      cardText: body.cardText || ''
    }
  });

  return NextResponse.json({ order });
}
