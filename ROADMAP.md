# LaunchPilot — خارطة الطريق إلى MVP

> **الهدف:** الوصول إلى منتج أولي (MVP) جاهز للإطلاق خلال 4 أسابيع، مع التركيز على نظام الدفع وإدارة المستخدمين.

---

## الأسبوع 1: البنية التحتية للمستخدمين والمصادقة

### اليوم 1-2: نظام المصادقة (Authentication)
- [ ] إعداد NextAuth.js مع مزودي البريد الإلكتروني/كلمة المرور و Google OAuth
- [ ] إنشاء صفحات تسجيل الدخول والتسجيل (`/auth/signin`, `/auth/signup`)
- [ ] إضافة صفحة استعادة كلمة المرور (`/auth/forgot-password`, `/auth/reset-password`)
- [ ] تفعيل التحقق من البريد الإلكتروني (Email Verification)
- [ ] إنشاء middleware لحماية المسارات الخاصة

### اليوم 3-4: إدارة الملف الشخصي
- [ ] صفحة الملف الشخصي (`/dashboard/profile`) — تعديل الاسم، البريد الإلكتروني، الصورة
- [ ] إعداد رفع الصور الرمزية (Avatar Upload)
- [ ] إعدادات الخصوصية (`/dashboard/privacy`)
- [ ] حذف الحساب مع تأكيد

### اليوم 5: نظام الصلاحيات (RBAC)
- [ ] إنشاء أدوار المستخدمين (User, Pro, Business, Enterprise, Admin)
- [ ] ربط الصلاحيات بالأدوار في قاعدة البيانات
- [ ] إنشاء middleware للتحقق من الصلاحيات على المسارات
- [ ] إنشاء دوال مساعدة `checkPermission()` و `requireRole()`

---

## الأسبوع 2: نظام الاشتراكات والخطط

### اليوم 1-2: خطط الاشتراك
- [ ] إنشاء جدول `subscription_plans` في Prisma (Free, Pro, Business, Enterprise)
- [ ] إنشاء صفحة التسعير (`/pricing`) مع toggle شهري/سنوي
- [ ] إضافة ميزة المقارنة بين الخطط
- [ ] إنشاء API endpoints للخطط: `GET /api/subscriptions/plans`

### اليوم 3-4: إدارة الاشتراكات
- [ ] إنشاء جدول `user_subscriptions` في Prisma
- [ ] إنشاء جدول `subscription_events` لتسجيل الأحداث (ترقية، تخفيض، إلغاء)
- [ ] إنشاء جدول `usage_tracking` لتتبع الاستخدام
- [ ] دوال إنشاء الاشتراك، الترقية، التخفيض، الإلغاء
- [ ] صفحة الاشتراك في لوحة التحكم (`/dashboard/subscription`)

### اليوم 5: الفترة التجريبية والكوبونات
- [ ] نظام الفترة التجريبية (Trial) — إنشاء، انتهاء، تحويل تلقائي
- [ ] إنشاء جدول `subscription_coupons` للكوبونات والخصومات
- [ ] تطبيق الكوبونات عند الاشتراك
- [ ] التحقق من صلاحية الكوبونات (تاريخ، عدد مرات الاستخدام)

---

## الأسبوع 3: نظام الدفع (Payment Integration)

### اليوم 1-2: بوابة الدفع — PayTabs
- [ ] إنشاء حساب PayTabs والحصول على API keys
- [ ] إعداد متغيرات البيئة (`PAYTABS_PROFILE_ID`, `PAYTABS_SERVER_KEY`)
- [ ] إنشاء مكتبة الدفع `src/lib/payment/paytabs.ts`:
  - [ ] دالة `createPaymentPage()` — إنشاء صفحة دفع
  - [ ] دالة `verifyPayment()` — التحقق من نجاح الدفع
  - [ ] دالة `refundPayment()` — استرداد المبلغ
- [ ] إنشاء أنواع TypeScript للدفع `src/lib/payment/types.ts`

### اليوم 3: Webhooks ومعالجة الدفع
- [ ] إنشاء endpoint لـ Webhook: `POST /api/payments/webhook`
- [ ] معالجة أحداث الدفع (success, failed, refunded)
- [ ] تحديث حالة الاشتراك تلقائياً عند نجاح الدفع
- [ ] إرسال إشعارات للمستخدم عند نجاح/فشل الدفع

### اليوم 4: الفواتير وسجل المدفوعات
- [ ] إنشاء جدول `invoices` في Prisma
- [ ] إنشاء رقم فاتورة تلقائي
- [ ] عرض سجل الفواتير في لوحة التحكم
- [ ] إنشاء API: `GET /api/subscriptions/invoices`

### اليوم 5: إدارة الدفع في لوحة التحكم
- [ ] عرض حالة الاشتراك الحالية
- [ ] تغيير طريقة الدفع
- [ ] تنزيل الفواتير (PDF)
- [ ] إلغاء الاشتراك (فوري / نهاية الفترة)

---

## الأسبوع 4: اللمسات النهائية والإطلاق

### اليوم 1-2: حدود الاستخدام (Usage Limits)
- [ ] تطبيق حدود الاستخدام لكل خطة (عدد المفضلات، المجموعات، المقارنات)
- [ ] عرض شريط التقدم للاستخدام في لوحة التحكم
- [ ] إشعارات عند الاقتراب من الحد الأقصى
- [ ] منع تجاوز الحدود مع رسالة ترقية

### اليوم 3: البريد الإلكتروني والإشعارات
- [ ] إعداد خدمة البريد الإلكتروني (Resend / SendGrid)
- [ ] قوالب البريد الإلكتروني:
  - [ ] تأكيد الاشتراك
  - [ ] تأكيد الدفع
  - [ ] انتهاء الفترة التجريبية
  - [ ] تجديد الاشتراك
  - [ ] إلغاء الاشتراك
- [ ] إشعارات داخل التطبيق (In-app notifications)

### اليوم 4: الاختبارات والتوثيق
- [ ] اختبارات الوحدة (Unit Tests) لنظام الدفع
- [ ] اختبارات التكامل (Integration Tests) للاشتراكات
- [ ] اختبار تدفق الدفع الكامل (Sandbox)
- [ ] توثيق API endpoints
- [ ] توثيق متغيرات البيئة المطلوبة

### اليوم 5: التدقيق والإطلاق
- [ ] مراجعة أمنية (Security Review)
- [ ] التحقق من SSL/TLS
- [ ] إعداد monitoring و logging
- [ ] اختبار الأداء
- [ ] **الإطلاق (Launch) 🚀**

---

## هيكل المشروع الأساسي

```
launchpilot/
├── .env.example              # متغيرات البيئة
├── .gitignore
├── next.config.js
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
│
├── prisma/
│   └── schema.prisma         # نموذج قاعدة البيانات
│
├── public/                   # الملفات الثابتة
│   └── favicon.svg
│
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── layout.tsx        # التخطيط الرئيسي
│   │   ├── page.tsx          # الصفحة الرئيسية
│   │   ├── globals.css       # أنماط Tailwind
│   │   │
│   │   ├── auth/             # صفحات المصادقة
│   │   │   ├── signin/
│   │   │   ├── signup/
│   │   │   └── error/
│   │   │
│   │   ├── dashboard/        # لوحة التحكم
│   │   │   ├── page.tsx
│   │   │   ├── profile/
│   │   │   ├── subscription/
│   │   │   └── privacy/
│   │   │
│   │   ├── pricing/          # صفحة التسعير
│   │   │   └── page.tsx
│   │   │
│   │   └── api/              # API Routes
│   │       ├── auth/
│   │       ├── subscriptions/
│   │       └── payments/
│   │
│   ├── components/           # المكونات المشتركة
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── AuthProvider.tsx
│   │
│   ├── lib/                  # المكتبات والدوال المساعدة
│   │   ├── auth.ts           # إعدادات NextAuth
│   │   ├── prisma.ts         # اتصال Prisma
│   │   ├── subscriptions.ts  # منطق الاشتراكات
│   │   ├── permissions.ts    # نظام الصلاحيات
│   │   └── payment/          # نظام الدفع
│   │       ├── types.ts
│   │       └── paytabs.ts
│   │
│   ├── hooks/                # React Hooks
│   ├── types/                # أنواع TypeScript
│   └── middleware.ts         # Middleware للحماية
│
└── tests/                    # الاختبارات
```

---

## التقنيات المستخدمة

| التقنية | الغرض |
|---------|-------|
| **Next.js 15** | إطار العمل الرئيسي (App Router) |
| **TypeScript** | أمان الأنواع |
| **Tailwind CSS** | التصميم والتنسيق |
| **Prisma** | ORM لإدارة قاعدة البيانات |
| **PostgreSQL** | قاعدة البيانات |
| **NextAuth.js** | المصادقة وإدارة الجلسات |
| **PayTabs** | بوابة الدفع |
| **Zod** | التحقق من صحة البيانات |
| **Lucide React** | الأيقونات |

---

## متغيرات البيئة المطلوبة

```env
# قاعدة البيانات
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# NextAuth
AUTH_SECRET="..."
AUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# PayTabs
PAYTABS_PROFILE_ID="..."
PAYTABS_SERVER_KEY="..."
PAYTABS_BASE_URL="https://secure.paytabs.com"

# البريد الإلكتروني
RESEND_API_KEY="..."
EMAIL_FROM="noreply@launchpilot.com"
```

---

## معايير نجاح MVP

- [x] تسجيل الدخول وإنشاء حساب (Email + Google)
- [x] 4 خطط اشتراك (Free, Pro, Business, Enterprise)
- [x] دفع آمن عبر PayTabs
- [x] إدارة الاشتراك (ترقية، تخفيض، إلغاء)
- [x] فترة تجريبية لمدة 14 يوم
- [x] حدود استخدام لكل خطة
- [x] فواتير وسجل مدفوعات
- [x] لوحة تحكم للمستخدم
- [x] نظام صلاحيات كامل (RBAC)
- [x] إشعارات البريد الإلكتروني