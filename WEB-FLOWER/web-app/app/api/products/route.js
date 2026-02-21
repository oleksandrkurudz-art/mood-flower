import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseJsonSafe } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const flowerType = searchParams.get('flowerType') || '';
    const color = searchParams.get('color') || '';
    const maxPrice = Number(searchParams.get('maxPrice') || 100000);
    const includeInactive = searchParams.get('includeInactive') === '1';

    const products = await prisma.product.findMany({
      where: {
        ...(includeInactive ? {} : { isActive: true }),
        name: q ? { contains: q } : undefined,
        ...(flowerType ? { flowerType } : {}),
        ...(color ? { color } : {}),
        basePrice: { lte: maxPrice }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(products.map((p) => ({ ...p, gallery: parseJsonSafe(p.gallery, []) })));
  } catch (error) {
    console.error('GET /api/products failed', error);
    return NextResponse.json({ error: 'products_fetch_failed' }, { status: 500 });
  }
}

export async function POST(request) {
  const body = await request.json();
  const created = await prisma.product.create({
    data: {
      name: body.name,
      shortDesc: body.shortDesc || '',
      fullDesc: body.fullDesc || '',
      basePrice: Number(body.basePrice || 0),
      stockQty: Math.max(Number(body.stockQty || 0), 0),
      image: body.image || '',
      gallery: JSON.stringify(body.gallery || []),
      flowerType: body.flowerType || 'other',
      color: body.color || 'mix',
      category: body.category || 'flowers',
      isActive: Boolean(body.isActive)
    }
  });
  return NextResponse.json(created);
}

export async function PATCH(request) {
  const body = await request.json();
  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const updated = await prisma.product.update({
    where: { id: Number(body.id) },
    data: {
      name: body.name,
      shortDesc: body.shortDesc,
      fullDesc: body.fullDesc,
      basePrice: Number(body.basePrice),
      stockQty: Math.max(Number(body.stockQty || 0), 0),
      image: body.image,
      gallery: JSON.stringify(body.gallery || []),
      flowerType: body.flowerType || 'other',
      color: body.color,
      category: body.category || 'flowers',
      isActive: Boolean(body.isActive)
    }
  });
  return NextResponse.json(updated);
}

export async function DELETE(request) {
  const body = await request.json();
  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await prisma.product.delete({ where: { id: Number(body.id) } });
  return NextResponse.json({ ok: true });
}
