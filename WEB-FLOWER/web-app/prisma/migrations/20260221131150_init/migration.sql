-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "shortDesc" TEXT NOT NULL,
    "fullDesc" TEXT NOT NULL,
    "basePrice" INTEGER NOT NULL,
    "image" TEXT NOT NULL,
    "gallery" TEXT NOT NULL,
    "flowerType" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" SERIAL NOT NULL,
    "orderNo" TEXT NOT NULL,
    "telegramUserId" TEXT,
    "customerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "orderType" TEXT NOT NULL,
    "city" TEXT,
    "street" TEXT,
    "building" TEXT,
    "apartment" TEXT,
    "comment" TEXT,
    "deliveryDate" TEXT NOT NULL,
    "deliveryTime" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'new',
    "status" TEXT NOT NULL DEFAULT 'new',
    "itemsJson" TEXT NOT NULL,
    "subtotal" INTEGER NOT NULL,
    "deliveryPrice" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL,
    "cardText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "shopPhone" TEXT NOT NULL,
    "telegramLink" TEXT NOT NULL,
    "shopAddress" TEXT NOT NULL,
    "deliveryPrice" INTEGER NOT NULL DEFAULT 100,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNo_key" ON "Order"("orderNo");
