# مووی‌تون (MovieToon) — فرانت‌اند فارسی

وب‌سایت نمایشی تماشای فیلم، سریال و انیمیشن — مشابه ساختار zardfilm/plan — **فقط فرانت‌اند**، بدون بک‌اند و بدون سطح دسترسی.

## چرا React برای جزایر تعاملی؟
از بین React/Preact/Svelte، **React** انتخاب شد چون ادغام رسمی `@astrojs/react` پایدار است، اکوسیستم و مستندات گسترده‌ای دارد و برای جزایری مثل پلیر، جستجوی زنده، کاروسل و تب فصل‌ها کافی و آشنا است. جاوااسکریپت سمت‌کاربر حداقلی نگه داشته شده (فقط جزایر `client:load/visible` + اسکریپت‌های inline کوچک).

## راه‌اندازی

```bash
npm install
npm run dev     # http://localhost:4321
npm run build   # خروجی static در dist/
npm run preview
```

> این پروژه پورت 4321 را مال خود می‌داند (`server.port` + `strictPort` در
> `astro.config.mjs`). همیشه از همین پوشه (`repos/MovieToon`) اجرا کنید:
> اگر نمونه دیگری (مثلاً پروژه دیگری) روی 4321 باشد، dev سرور خطا می‌دهد
> به‌جای اینکه بی‌سروصدا روی پورت دیگری بالا بیاید. نمونه قبلی را قبل از
> اجرای دوباره متوقف کنید. پورت‌ها: فرانت‌اند مووی‌تون **4321**، API (پروژه
> جدا) **3001** — هیچ‌کدام مشترک نیستند.

## ساختار پوشه‌ها

```
src/
  pages/        # همه روت‌ها (index, movies, series, animations, genres, watch, search, actors, collections, top, new, login/register/forgot-password, profile, favorites, watchlist, subscription/plans, about/contact/faq/terms/privacy/report/dmca, 404, robots.txt, api-titles.json, sitemap via @astrojs/sitemap)
  layouts/Base.astro   # html[lang=fa dir=rtl]، فونت وزیرمتن، تم، SEO، toast
  components/   # Header, Footer, TitleCard, TitleDetail, Breadcrumbs, Pagination, SectionHeading, EmptyState
  islands/      # React: HeroSlider, TitleCarousel, SearchBox, WatchPlayer, SeasonTabs, CommentsSection, ListActions
  data/index.ts # موک‌دیتا: ۴۲ عنوان، ۱۵ بازیگر، ۱۲ ژانر، کامنت، پلن، کالکشن
  types/        # Title, Episode, Season, Actor, Genre, Comment, Plan, Collection
  lib/          # fa.ts (اعداد فارسی، تاریخ شمسی، مدت، قیمت), repository.ts (جستجو/فیلتر/مرتب‌سازی/صفحه‌بندی — خالص و تست‌پذیر), site.ts, store.ts (localStorage)
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
