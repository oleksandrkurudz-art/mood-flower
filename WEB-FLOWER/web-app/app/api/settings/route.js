import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const setting = await prisma.setting.findUnique({ where: { id: 1 } });
  return NextResponse.json(setting);
}

export async function PATCH(request) {
  const body = await request.json();
  const updated = await prisma.setting.upsert({
    where: { id: 1 },
    create: { id: 1, shopPhone: body.shopPhone || '', telegramLink: body.telegramLink || '', shopAddress: body.shopAddress || '', deliveryPrice: Number(body.deliveryPrice || 100) },
    update: { shopPhone: body.shopPhone || '', telegramLink: body.telegramLink || '', shopAddress: body.shopAddress || '', deliveryPrice: Number(body.deliveryPrice || 100) }
  });
  return NextResponse.json(updated);
}
