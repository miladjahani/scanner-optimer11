# ⚡ MiSub & CF-Optimizer Authentic Master Suite (Vue 3 PWA)

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live%20PWA-blue?style=for-the-badge&logo=github)](https://github.com/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers%20Ready-f38020?style=for-the-badge&logo=cloudflare)](https://workers.cloudflare.com/)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-purple?style=for-the-badge&logo=pwa)](https://web.dev/progressive-web-apps/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

> سامانه اصیل، ماژولار و جامع بر پایه **Vue 3 و ساختار اصلی MiSub** که پیرامون **هسته بهینه‌ساز کانکشن (CF-Optimizer)** ادغام شده و از **اسکنر چند هزارتایی آی‌پی تمیز کلودفلر** تغذیه می‌کند.

---

## 🌟 ساختار ادغام‌شده پیرامون هسته بهینه‌ساز (CF-Optimizer Core)

```text
 ┌───────────────────────────────────┐       ┌───────────────────────────────────┐
 │   1. مخزن سابسکریپشن (MiSub)       │       │ 2. اسکنر آی‌پی (Clean-IP-Scanner) │
 │  - پارس VLESS / VMess / Trojan    │       │  - مخزن ۳,۸۰۰+ رنج‌های Anycast    │
 │  - حذف تکراری‌ها (Deduplication)  │       │  - پینگ، جیتر و پکت‌لاس واقعی    │
 │  - مبدل کلاینت (Clash / Singbox)  │       │  - تست سرعت دانلود (MB/s)         │
 └─────────────────┬─────────────────┘       └─────────────────┬─────────────────┘
                   │                                           │
                   │ (کانفیگ‌های خام)                          │ (آی‌پی‌های تمیز تست‌شده)
                   ▼                                           ▼
 ┌───────────────────────────────────────────────────────────────────────────────┐
 │               ⚡ هسته مرکزی: بهینه‌ساز کانکشن (CF-Optimizer Core)              │
 │  - تطبیق خودکار پورت‌های کلودفلر (TLS: 443, 8443, ... | Non-TLS: 80, 8080)   │
 │  - آزمایشگاه پکت‌های فرگمنت (Fragment: Length 10-50, Interval 10-20ms) ضد DPI  │
 │  - تنظیمات پیشرفته SNI، هدر Host و پیشوند نام نودها                           │
 │  - تولید بارکد QR برای اسکن فوری در کلاینت‌های موبایل                         │
 └───────────────────────────────────────┬───────────────────────────────────────┘
                                         │
                                         ▼
 ┌───────────────────────────────────────────────────────────────────────────────┐
 │                        خروجی‌های نهایی و توزیع چندگانه                         │
 │  1. لینک سابسکریپشن مستقیم از Cloudflare Worker (/sub?url=...&ip=...)        │
 │  2. خروجی کلاینت Clash Meta (Mihomo YAML) با گروه‌های خودکار                  │
 │  3. خروجی کلاینت Sing-box (JSON) با Outbounds بهینه‌شده                      │
 │  4. فرمت استاندارد V2Ray Base64                                               │
 └───────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 راهنمای استقرار در GitHub Pages

1. مخزن را در گیت‌هاب ایجاد و فایل‌ها را روی شاخه `main` پوش کنید.
2. به بخش **Settings** > **Pages** بروید و Source را روی **GitHub Actions** بگذارید.
3. اکشن `.github/workflows/deploy.yml` به صورت خودکار پروژه را با Node 22 بیلد و منتشر می‌کند.

---

## ☁️ استقرار بک‌اند Cloudflare Worker

1. در داشبورد [Cloudflare Workers](https://dash.cloudflare.com/) یک ورکر بسازید.
2. تمام کدهای فایل `worker/worker.js` را داخل آن قرار داده و Deploy کنید.
3. آدرس ورکر را در تب **تنظیمات** برنامه وارد نمایید.

---

## 📱 اجرا در محیط Termux (اندروید)

```bash
cd misub-cf-suite
chmod +x setup-termux.sh
./setup-termux.sh
npm run dev
```
