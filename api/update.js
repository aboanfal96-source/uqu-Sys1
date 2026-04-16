// /api/update.js — Update request status and/or save generated report (admin only)
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
  if (!KV_URL || !KV_TOKEN) {
    return res.status(500).json({ error: 'قاعدة البيانات غير مهيأة' });
  }

  try {
    const body = req.body || {};
    const id = body.id;
    if (!id) return res.status(400).json({ error: 'معرف الطلب مطلوب' });

    // Get existing record
    const getRes = await fetch(KV_URL + '/get/' + encodeURIComponent(id), {
      headers: { Authorization: 'Bearer ' + KV_TOKEN }
    });
    const getData = await getRes.json();
    if (!getData.result) return res.status(404).json({ error: 'الطلب غير موجود' });

    let record;
    try {
      record = typeof getData.result === 'string' ? JSON.parse(getData.result) : getData.result;
    } catch (e) { return res.status(500).json({ error: 'تلف بيانات الطلب' }); }

    // Apply updates
    if (body.status) record.status = body.status;
    if (typeof body.adminNotes === 'string') record.adminNotes = body.adminNotes;
    if (body.generatedReport) record.generatedReport = body.generatedReport;
    record.reviewedAt = new Date().toISOString();

    // Save
    await fetch(KV_URL + '/set/' + encodeURIComponent(id), {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + KV_TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });

    return res.status(200).json({ ok: true, record: record });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
