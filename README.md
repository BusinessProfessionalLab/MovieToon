# مووی‌تون (MovieToon) — وب‌سایت فارسی فیلم و سریال

وب‌سایت فارسی فیلم، سریال و انیمیشن — فقط فرانت (Astro). بک‌اند (NestJS) در ریپوی جداگانه نگه‌داری می‌شود و فرانت از طریق `API_INTERNAL_URL` / `PUBLIC_API_URL` به آن وصل می‌شود.

## چرا React برای جزایر تعاملی؟
از بین React/Preact/Svelte، **React** انتخاب شد چون ادغام رسمی `@astrojs/react` پایدار است، اکوسیستم و مستندات گسترده‌ای دارد و برای جزایری مثل پلیر، جستجوی زنده، کاروسل و تب فصل‌ها کافی و آشنا است. جاوااسکریپت سمت‌کاربر حداقلی نگه داشته شده (فقط جزایر `client:load/visible` + اسکریپت‌های inline کوچک).

## راه‌اندازی

```bash
npm install
cp .env.example .env
# مقدار AUTH_JWT_SECRET را با یک کلید تصادفی حداقل ۳۲ بایتی جایگزین کنید.
npm run dev       # http://localhost:4321
npm run build     # SSR در dist/server
npm run preview   # پیش‌نمایش خروجی SSR
npm start         # اجرای سرور ساخته‌شده
```

> این پروژه پورت 4321 را مال خود می‌داند (`server.port` + `strictPort` در
> `astro.config.mjs`). همیشه از همین پوشه (`repos/MovieToon`) اجرا کنید:
> اگر نمونه دیگری (مثلاً پروژه دیگری) روی 4321 باشد، dev سرور خطا می‌دهد
> به‌جای اینکه بی‌سروصدا روی پورت دیگری بالا بیاید. نمونه قبلی را قبل از
> اجرای دوباره متوقف کنید. فرانت و API احراز هویت هم‌مبدأ هستند.

## احراز هویت و پنل مدیریت

- پروژه برای SSR به Node.js نسخهٔ 24.15 یا بالاتر نیاز دارد. آداپتر رسمی Node، APIها و صفحهٔ ادمین را روی همان مبدأ فرانت اجرا می‌کند.
- پایگاه داده PostgreSQL است و در ریپوی جداگانهٔ بک‌اند مدیریت می‌شود. متغیرهای `DB_*` را در `.env` همان ریپو تنظیم کنید؛ فایل‌های `.env` در Git نادیده گرفته می‌شوند.
- ثبت‌نام عمومی فقط نقش `user` می‌سازد. پنل `/admin` در سمت سرور نقش فعلی کاربر را از دیتابیس بررسی می‌کند.
- ساخت ادمین: مستقیم در فرانت ثبت‌نام کنید، سپس در Postgres نقش را بالا ببرید: `UPDATE users SET role='admin' WHERE email='...';` گذرواژه باید دست‌کم ۱۲ نویسه باشد.
- در تولید، `AUTH_JWT_SECRET` را با کلید تصادفی حداقل ۳۲ بایتی تنظیم کنید؛ سرور تولیدی بدون آن بالا نمی‌آید. نمونهٔ تولید کلید: `node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"`
- access JWT پانزده دقیقه اعتبار دارد؛ refresh JWT هفت روزه در کوکی `HttpOnly` قرار می‌گیرد، در دیتابیس فقط هش آن ذخیره می‌شود و هنگام refresh می‌چرخد. خروج، خانوادهٔ توکن refresh را لغو می‌کند.
- API ورود و ثبت‌نام: `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/refresh`, `POST /api/auth/logout`; وضعیت حساب: `GET /api/auth/me`.

## ساختار پوشه‌ها

```
src/
  pages/        # صفحات سایت، API احراز هویت و /admin
  middleware.ts # بارگذاری کاربر جاری از access token امضاشده
  layouts/Base.astro   # html[lang=fa dir=rtl]، فونت وزیرمتن، تم، SEO، toast
  components/   # Header, Footer, TitleCard, TitleDetail, Breadcrumbs, Pagination, SectionHeading, EmptyState
  islands/      # React: HeroSlider, TitleCarousel, SearchBox, WatchPlayer, SeasonTabs, CommentsSection, ListActions
  data/index.ts # موک‌دیتا: ۴۲ عنوان، ۱۵ بازیگر، ۱۲ ژانر، کامنت، پلن، کالکشن
  types/        # Title, Episode, Season, Actor, Genre, Comment, Plan, Collection
  lib/auth/     # هش گذرواژه، JWT و نشست‌های refresh
  lib/          # فرمت فارسی، repository، API داده و ذخیره‌های محلی
  styles/global.css  # دیزاین‌سیستم با CSS variables + تم روشن/تیره
public/images/  # پوستر/بک‌دراپ/بازیگر SVG جایگزین (ساخته دست، بدون کپی‌رایت)
```

## جایگزینی موک‌دیتا با API واقعی
1. `src/data/index.ts` (توابع `titles`, `getTitle`, ...) را با فراخوانی `fetch` به API خودتان جایگزین کنید؛ تایپ‌های `src/types` همان قرارداد API می‌شوند.
2. توابع `src/lib/repository.ts` امضای ورودی/خروجی یکسانی دارند؛ کافی است منبع داده را عوض کنید (فیلتر/جستجو می‌تواند سمت‌سرور برود).
3. `getStaticPaths` صفحات جزئیات همین حالا از دیتا می‌خواند؛ با API کافی است در بیلد از اندپوینت بخوانید.
4. `localStorage` (علاقه‌مندی/تماشای بعدی/ادامه تماشا/تم) در `src/lib/store.ts` متمرکز است و بعدا با حساب کاربری سینک می‌شود.

## نکات RTL و فارسی
- `lang="fa" dir="rtl"` در همه صفحات (layout واحد).
- خصوصیات منطقی CSS (`start/end`, `ms-auto`)، فلش‌های آگاه‌به-RTL در کاروسل‌ها.
- اعداد/سال با ارقام فارسی (`toFa`)، امتیاز با ممیز فارسی، تاریخ‌ها با `formatJalaliDate`، سال کپی‌رایت فوتر شمسی.
- فونت وزیرمتن با `font-display: swap`.

## اسکریپت‌ها و کیفیت
- `npm run build` باید بدون خطا باشد. ESLint + Prettier (با prettier-plugin-astro) پیکربندی شده.
