// /api/submit.js — Save employee request to Upstash KV
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const KV_URL = process.env.KV_REST_API_URL;
  const KV_TOKEN = process.env.KV_REST_API_TOKEN;
  if (!KV_URL || !KV_TOKEN) {
    return res.status(500).json({ error: 'قاعدة البيانات غير مهيأة — راجع إعدادات Vercel KV' });
  }

  try {
    const body = req.body || {};
    const required = ['requesterName', 'department', 'projectName', 'projectType', 'description'];
    for (const k of required) {
      if (!body[k] || String(body[k]).trim() === '') {
        return res.status(400).json({ error: 'حقل مطلوب ناقص: ' + k });
      }
    }

    const ts = Date.now();
    const id = 'REQ-' + ts + '-' + Math.floor(Math.random() * 1000);
    const record = {
      id: id,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      requesterName: String(body.requesterName).trim(),
      department: String(body.department).trim(),
      email: String(body.email || '').trim(),
      phone: String(body.phone || '').trim(),
      projectName: String(body.projectName).trim(),
      projectType: String(body.projectType).trim(),
      location: String(body.location || '').trim(),
      description: String(body.description).trim(),
      justification: String(body.justification || '').trim(),
      estimatedCost: String(body.estimatedCost || '').trim(),
      duration: String(body.duration || '').trim(),
      beneficiary: String(body.beneficiary || '').trim(),
      notes: String(body.notes || '').trim(),
      adminNotes: '',
      reviewedAt: null,
      generatedReport: null
    };

    // Save request JSON
    const setRes = await fetch(KV_URL + '/set/' + encodeURIComponent(id), {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + KV_TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
    if (!setRes.ok) {
      const t = await setRes.text();
      return res.status(500).json({ error: 'فشل الحفظ: ' + t });
    }

    // Prepend id to the list
    await fetch(KV_URL + '/lpush/requests_list/' + encodeURIComponent(id), {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + KV_TOKEN }
    });

    return res.status(200).json({ ok: true, id: id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
