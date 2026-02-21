import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const setting = await prisma.setting.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        shopPhone: '',
        telegramLink: '',
        shopAddress: '',
        deliveryPrice: 100
      },
      update: {}
    });
    return NextResponse.json(setting);
  } catch (error) {
    console.error('GET /api/settings failed', error);
    return NextResponse.json({ error: 'settings_fetch_failed' }, { status: 500 });
  }
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
