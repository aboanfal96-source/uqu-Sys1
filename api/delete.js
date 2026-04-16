// /api/delete.js — Delete a request (admin only)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const adminKey = req.headers['x-admin-key'];
  if (!process.env.ADMIN_KEY || adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'غير مصرح' });
  }

  const KV_URL = process.env.KV_REST_API_URL;
  const KV_TOKEN = process.env.KV_REST_API_TOKEN;
  if (!KV_URL || !KV_TOKEN) return res.status(500).json({ error: 'قاعدة البيانات غير مهيأة' });

  try {
    const body = req.body || {};
    const id = body.id;
    if (!id) return res.status(400).json({ error: 'معرف الطلب مطلوب' });

    await fetch(KV_URL + '/del/' + encodeURIComponent(id), {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + KV_TOKEN }
    });
    await fetch(KV_URL + '/lrem/requests_list/0/' + encodeURIComponent(id), {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + KV_TOKEN }
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
