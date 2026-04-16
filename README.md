# 📚 نظام الدراسات الخمسة — جامعة أم القرى

## 🎯 المكونات

```
├── index.html          ← صفحة الموظفين
├── admin.html          ← لوحة المدير
├── generator.html      ← المولد الأصلي (ملفك) بعد إضافة سطر واحد ⭐
├── integration.js      ← سكربت التكامل (يُحمّله المولد تلقائياً)
├── vercel.json
└── api/
    ├── submit.js, requests.js, update.js, delete.js, generate.js
```

## 🔧 خطوات النشر

### 1) تجهيز ملف `generator.html` — سطر واحد فقط ⭐

افتح ملفك الأصلي، وابحث عن `<body>` ثم أضِف **مباشرة بعده** هذا السطر:

```html
<script src="/integration.js"></script>
```

يصبح الملف هكذا:

```html
<body>
<script src="/integration.js"></script>

<header class="hdr">
  ...باقي الملف كما هو...
```

احفظ الملف باسم `generator.html`. **هذا كل ما تحتاجه.**

### 2) إعداد Vercel KV

Vercel → مشروعك → **Storage** → **Create Database** → **Upstash Redis** → Frankfurt → Create → **Connect to Project**

### 3) متغيرات البيئة

في Vercel → Settings → Environment Variables:

| Key | Value |
|---|---|
| `ANTHROPIC_API_KEY` | `sk-ant-...` |
| `ADMIN_KEY` | كلمة مرور المدير |
| `KV_REST_API_URL` | (تلقائي) |
| `KV_REST_API_TOKEN` | (تلقائي) |

### 4) رفع الملفات

احذف الملفات القديمة من GitHub وارفع:
`index.html` · `admin.html` · `generator.html` · `integration.js` · `vercel.json` · مجلد `api/`

## 🌐 الروابط

| الرابط | الوظيفة |
|---|---|
| `/` | نموذج الموظفين (عام) |
| `/admin` | لوحة المدير |
| `/generator` | المولد المستقل |

## 🔄 التدفق

1. الموظف يُرسل طلباً من `/`
2. المدير يفتح `/admin` ويرى القائمة
3. يضغط على طلب ← "✨ تحضير الدراسة" ← يفتح المولد مع بيانات الطلب معبأة
4. يُولّد التقرير ← يضغط "💾 حفظ للطلب" ← يُقفل الطلب كـ "مكتمل"
