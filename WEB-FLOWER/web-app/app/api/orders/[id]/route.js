import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_, { params }) {
  const order = await prisma.order.findUnique({ where: { id: Number(params.id) } });
  if (!order) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(order);
}

export async function PATCH(request, { params }) {
  const body = await request.json();
  const updated = await prisma.order.update({
    where: { id: Number(params.id) },
    data: {
      status: body.status || undefined,
      paymentStatus: body.paymentStatus || undefined
    }
  });
  return NextResponse.json(updated);
}
