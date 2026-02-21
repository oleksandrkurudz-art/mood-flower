import { NextResponse } from 'next/server';
import { liqpayData, liqpaySignature } from '@/lib/utils';

export async function POST(request) {
  const body = await request.json();
  const publicKey = process.env.LIQPAY_PUBLIC_KEY;
  const privateKey = process.env.LIQPAY_PRIVATE_KEY;
  if (!publicKey || !privateKey) return NextResponse.json({ error: 'LiqPay keys are missing' }, { status: 400 });
  const data = liqpayData({ publicKey, orderNo: body.orderNo, amount: Number(body.total || 0), description: `Flower order ${body.orderNo}`, resultUrl: body.resultUrl || '', serverUrl: body.serverUrl || '' });
  const signature = liqpaySignature(privateKey, data);
  return NextResponse.json({ data, signature });
}
