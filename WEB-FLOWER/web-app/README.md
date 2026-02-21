# Mood Flowers Telegram WebApp

Зроблено з нуля за `WEB-FLOWERS.txt`.

## Реалізовано
- Telegram WebApp каталог з картками, фільтрами і пошуком
- Сторінка товару: галерея, розмір, допи (листівка/шоколад/іграшка), текст листівки
- Кошик: зміна кількості, підсумки, доставка
- Checkout: ім'я, телефон, самовивіз/доставка, адреса, дата/час, оплата
- Оплата: LiqPay або при отриманні
- Підтвердження замовлення + кнопка написати менеджеру в Telegram
- Адмінка: логін/пароль, замовлення зі статусами, CRUD товарів, налаштування
- API: products, orders, settings, liqpay checkout, telegram notify
- База даних: Prisma + SQLite

## Запуск
1. `npm install`
2. `npx prisma generate`
3. `npx prisma migrate dev --name init`
4. `node prisma/seed.js`
5. `npm run dev`

## ENV
Скопіюй `.env.example` в `.env` і заповни:
- `ADMIN_LOGIN`, `ADMIN_PASSWORD`
- `LIQPAY_PUBLIC_KEY`, `LIQPAY_PRIVATE_KEY`
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_CHAT_ID`
- `NEXT_PUBLIC_TELEGRAM_MANAGER_URL`

## URL
- Клієнт: `/`
- Адмін логін: `/admin`
- Замовлення: `/admin/orders`
- Товари: `/admin/products`
- Налаштування: `/admin/settings`

## Важливо
- Додай перевірку Telegram `initData` підпису і захист API ролями.
- LiqPay callback (`server_url`) винеси в окремий endpoint для підтвердження payment status.
