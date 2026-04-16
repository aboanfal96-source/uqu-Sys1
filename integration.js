// ═══════════════════════════════════════════════════════════════
// integration.js — تكامل مولد الدراسات الخمسة مع نظام الطلبات
// يُحمّل تلقائياً عند فتح generator.html
// ═══════════════════════════════════════════════════════════════

(function() {
  'use strict';

  // 1) التحقق من دخول المدير
  var ADMIN_KEY = '';
  try { ADMIN_KEY = sessionStorage.getItem('uqu_admin') || ''; } catch(e){}

  if (!ADMIN_KEY) {
    window.addEventListener('DOMContentLoaded', function() {
      document.body.innerHTML = '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0a1a1a;color:#fff;font-family:Tajawal,sans-serif;text-align:center;padding:20px"><div><div style="font-size:56px;margin-bottom:16px">🔐</div><h1 style="font-size:22px;margin-bottom:8px;color:#e8c050">يجب دخول المدير أولاً</h1><p style="color:rgba(255,255,255,.6);margin-bottom:24px">سيتم توجيهك للوحة الدخول...</p><a href="/admin" style="background:linear-gradient(135deg,#0d7a7a,#085f5f);color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700">الذهاب للوحة المدير ←</a></div></div>';
      setTimeout(function(){ window.location.href = '/admin'; }, 1800);
    });
    return;
  }

  window._ADMIN_KEY = ADMIN_KEY;

  // 2) Override fetch لإضافة مفتاح المدير لأي طلب على /api/*
  var _origFetch = window.fetch;
  window.fetch = function(url, opts) {
    opts = opts || {};
    if (typeof url === 'string' && url.indexOf('/api/') === 0) {
      opts.headers = opts.headers || {};
      opts.headers['x-admin-key'] = ADMIN_KEY;
    }
    return _origFetch.call(this, url, opts);
  };

  function esc(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  // 3) قراءة رقم الطلب من URL وتعبئة النموذج
  var params = new URLSearchParams(window.location.search);
  var reqId = params.get('id');
  if (!reqId) return; // وضع مستقل

  window._REQ_ID = reqId;

  window.addEventListener('DOMContentLoaded', function() {
    // شارة معلومات الطلب
    var banner = document.createElement('div');
    banner.id = 'reqBanner';
    banner.style.cssText = 'background:linear-gradient(135deg,rgba(201,162,39,.18),rgba(13,122,122,.12));border:1px solid rgba(201,162,39,.35);border-radius:12px;padding:14px 20px;margin:20px auto 0;max-width:1100px;color:#e8c050;font-weight:600;font-size:13px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;font-family:Tajawal,Cairo,sans-serif';
    banner.innerHTML = '<span style="font-size:22px">📋</span><span>جارٍ تحميل بيانات الطلب: <span style="direction:ltr;font-family:monospace;background:rgba(0,0,0,.25);padding:3px 10px;border-radius:5px;color:#fff">' + esc(reqId) + '</span></span>';
    var wrap = document.querySelector('.wrap') || document.body;
    wrap.insertBefore(banner, wrap.firstChild);

    // جلب بيانات الطلب
    fetch('/api/requests', { method: 'GET' })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        var req = (data.requests || []).find(function(x) { return x.id === reqId; });
        if (!req) {
          banner.innerHTML = '<span style="font-size:22px">⚠️</span><span style="color:#e85050">لم يتم العثور على الطلب ' + esc(reqId) + '</span>';
          return;
        }
        window._REQ_DATA = req;

        // تعبئة الحقول
        var set = function(id, val) {
          var el = document.getElementById(id);
          if (el && val !== null && val !== undefined && val !== '') el.value = val;
        };
        set('fName', req.projectName);
        set('fLoc', req.location);
        set('fType', req.projectType);
        set('fDesc', req.description);
        set('fJust', req.justification);
        set('fBen', req.beneficiary);
        set('fDur', String(req.duration || '').replace(/[^\d]/g, ''));
        set('fCost', String(req.estimatedCost || '').replace(/[^\d.]/g, ''));

        // تحديث الشارة
        banner.innerHTML =
          '<span style="font-size:22px">📋</span>' +
          '<div style="flex:1">' +
            '<div style="color:#fff;font-size:14px;font-weight:700;margin-bottom:4px">' + esc(req.projectName) + '</div>' +
            '<div style="font-size:12px;color:rgba(255,255,255,.7)">مقدم الطلب: <b>' + esc(req.requesterName) + '</b> · القسم: <b>' + esc(req.department) + '</b> · <span style="direction:ltr;font-family:monospace;background:rgba(0,0,0,.25);padding:2px 8px;border-radius:4px;color:#e8c050">' + esc(reqId) + '</span></div>' +
          '</div>' +
          '<a href="/admin" style="background:rgba(0,0,0,.25);color:#fff;padding:6px 14px;border-radius:6px;text-decoration:none;font-size:12px;border:1px solid rgba(255,255,255,.15)">← رجوع للوحة</a>';
      })
      .catch(function(err) {
        banner.innerHTML = '<span style="font-size:22px">⚠️</span><span style="color:#e85050">خطأ في تحميل الطلب: ' + esc(err.message) + '</span>';
      });

    // مراقبة ظهور شريط التقرير لإضافة زر الحفظ
    var watchInterval = setInterval(function() {
      var rep = document.getElementById('repSec');
      var tacts = document.querySelector('.tacts');
      if (rep && rep.style.display === 'block' && tacts && !document.getElementById('btnSaveReq')) {
        var btn = document.createElement('button');
        btn.id = 'btnSaveReq';
        btn.className = 'bta gld';
        btn.innerHTML = '💾 حفظ للطلب';
        btn.style.cssText = 'background:linear-gradient(135deg,#c9a227,#a88020)!important;color:#fff!important;border-color:rgba(201,162,39,.5)!important';
        btn.onclick = saveReportToRequest;
        tacts.appendChild(btn);
      }
    }, 800);
  });

  // 4) حفظ التقرير للطلب
  function saveReportToRequest() {
    if (!window._REQ_ID) return alert('لا يوجد طلب مرتبط');
    if (!confirm('حفظ التقرير وإغلاق الطلب كـ "مكتمل"؟')) return;

    var btn = document.getElementById('btnSaveReq');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ جارٍ الحفظ...'; }

    var slidesEl = document.getElementById('slides');
    var reportHTML = slidesEl ? slidesEl.innerHTML : '';
    var projName = '';
    var rTitle = document.getElementById('rTitle');
    if (rTitle) projName = rTitle.textContent;

    fetch('/api/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: window._REQ_ID,
        status: 'completed',
        generatedReport: {
          title: projName,
          html: reportHTML,
          generatedAt: new Date().toISOString()
        }
      })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.error) {
        if (btn) { btn.disabled = false; btn.textContent = '💾 حفظ للطلب'; }
        return alert('خطأ: ' + data.error);
      }
      alert('✅ تم حفظ التقرير للطلب بنجاح\nيمكنك إغلاق التبويب الآن');
      if (btn) { btn.textContent = '✅ محفوظ'; btn.style.opacity = '0.6'; btn.disabled = true; }
    })
    .catch(function(err) {
      if (btn) { btn.disabled = false; btn.textContent = '💾 حفظ للطلب'; }
      alert('خطأ: ' + err.message);
    });
  }

  window._saveReportToRequest = saveReportToRequest;
})();
