import crypto from 'crypto';

export function getOrderNo() {
  return 'MF' + Date.now().toString().slice(-8);
}

export function parseJsonSafe(value, fallback) {
  try { return JSON.parse(value); } catch { return fallback; }
}

export function liqpayData({ publicKey, orderNo, amount, description, resultUrl, serverUrl }) {
  const payload = { public_key: publicKey, version: '3', action: 'pay', amount, currency: 'UAH', description, order_id: orderNo, result_url: resultUrl, server_url: serverUrl };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

export function liqpaySignature(privateKey, data) {
  return crypto.createHash('sha1').update(privateKey + data + privateKey).digest('base64');
}
