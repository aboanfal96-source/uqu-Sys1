// /api/requests.js — List all requests (admin only)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const adminKey = req.headers['x-admin-key'];
  if (!process.env.ADMIN_KEY || adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'غير مصرح — كلمة مرور المدير خاطئة' });
  }

  const KV_URL = process.env.KV_REST_API_URL;
  const KV_TOKEN = process.env.KV_REST_API_TOKEN;
  if (!KV_URL || !KV_TOKEN) {
    return res.status(500).json({ error: 'قاعدة البيانات غير مهيأة' });
  }

  try {
    // Get the list of IDs (most recent first)
    const listRes = await fetch(KV_URL + '/lrange/requests_list/0/499', {
      headers: { Authorization: 'Bearer ' + KV_TOKEN }
    });
    const listData = await listRes.json();
    const ids = listData.result || [];

    if (ids.length === 0) {
      return res.status(200).json({ requests: [] });
    }

    // Bulk fetch using mget
    const mgetUrl = KV_URL + '/mget/' + ids.map(encodeURIComponent).join('/');
    const mgetRes = await fetch(mgetUrl, {
      headers: { Authorization: 'Bearer ' + KV_TOKEN }
    });
    const mgetData = await mgetRes.json();
    const raw = mgetData.result || [];

    const requests = raw
      .map(function (item) {
        if (!item) return null;
        try {
          return typeof item === 'string' ? JSON.parse(item) : item;
        } catch (e) { return null; }
      })
      .filter(Boolean);

    return res.status(200).json({ requests: requests });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
