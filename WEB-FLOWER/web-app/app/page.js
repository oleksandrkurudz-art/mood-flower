import { prisma } from '@/lib/prisma';
import { parseJsonSafe } from '@/lib/utils';
import ClientApp from '@/components/ClientApp';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const [products, settings] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' } }),
    prisma.setting.findUnique({ where: { id: 1 } })
  ]);
  const normalized = products.map((p) => ({ ...p, gallery: parseJsonSafe(p.gallery, []) }));
  return <ClientApp initialProducts={normalized} settings={settings || { shopPhone: '', telegramLink: '', deliveryPrice: 100 }} />;
}
