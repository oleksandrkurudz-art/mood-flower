const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.setting.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      shopPhone: '+380000000000',
      telegramLink: 'https://t.me/your_manager_username',
      shopAddress: 'Kyiv, Main street, 1',
      deliveryPrice: Number(process.env.NEXT_PUBLIC_DELIVERY_PRICE || 100)
    },
    update: {}
  });

  const count = await prisma.product.count();
  if (!count) {
    await prisma.product.createMany({
      data: [
        {
          name: 'Rose Classic',
          shortDesc: '11 red roses in kraft',
          fullDesc: 'Classic bouquet for important moments.',
          basePrice: 1200,
          image: 'https://images.unsplash.com/photo-1519378058457-4c29a0a2efac?auto=format&fit=crop&w=900&q=80',
          gallery: JSON.stringify(['https://images.unsplash.com/photo-1519378058457-4c29a0a2efac?auto=format&fit=crop&w=900&q=80']),
          flowerType: 'rose',
          color: 'red',
          category: 'bouquet',
          isActive: true
        },
        {
          name: 'Tulip Mix',
          shortDesc: '15 colorful tulips',
          fullDesc: 'Fresh tulips, mixed shades.',
          basePrice: 980,
          image: 'https://images.unsplash.com/photo-1520763185298-1b434c919102?auto=format&fit=crop&w=900&q=80',
          gallery: JSON.stringify(['https://images.unsplash.com/photo-1520763185298-1b434c919102?auto=format&fit=crop&w=900&q=80']),
          flowerType: 'tulip',
          color: 'mix',
          category: 'flower',
          isActive: true
        }
      ]
    });
  }
}

main().finally(async () => prisma.$disconnect());
