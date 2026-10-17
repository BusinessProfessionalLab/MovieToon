import { useEffect, useRef, useState } from 'react';

interface HeroItem {
  slug: string;
  titleFa: string;
  titleEn: string;
  description: string;
  genres: string[];
  imdb: number;
  backdrop: string;
  detailHref: string;
  watchHref: string;
}

function faNum(n: number | string): string {
  return String(n).replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
}

export default function HeroSlider({ items }: { items: HeroItem[] }) {
  const [idx, setIdx] = useState(0);
  const timer = useRef<number | null>(null);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    timer.current = window.setInterval(() => setIdx((i) => (i + 1) % items.length), 7000);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [items.length]);

  if (!items.length) return null;
  const cur = items[idx];

  return (
    <section
      aria-label="پیشنهاد ویژه"
      className="relative overflow-hidden rounded-2xl border"
      style={{ borderColor: 'var(--border)' }}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        // RTL: swipe right -> previous visually... keep natural: swipe left = next
        if (dx < -40) setIdx((i) => (i + 1) % items.length);
        if (dx > 40) setIdx((i) => (i - 1 + items.length) % items.length);
        touchX.current = null;
      }}
    >
      <div className="relative h-[380px] md:h-[460px]">
        {items.map((it, i) => (
          <img
            key={it.slug}
            src={it.backdrop}
            alt=""
            aria-hidden={i !== idx}
            loading={i === 0 ? 'eager' : 'lazy'}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
            style={{ opacity: i === idx ? 1 : 0 }}
          />
        ))}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,.85) 10%, rgba(0,0,0,.35) 55%, rgba(0,0,0,.15))' }}
        />
        <div className="absolute bottom-0 inset-x-0 p-5 md:p-10 text-white">
          <p className="text-xs opacity-80 mb-2">{it_genres(cur)} • ⭐ {faNum(cur.imdb.toFixed(1))}</p>
          <h1 className="text-2xl md:text-4xl font-black">{cur.titleFa}</h1>
          <p className="text-xs opacity-70 mt-1" dir="ltr" style={{ textAlign: 'right' }}>{cur.titleEn}</p>
          <p className="text-sm opacity-90 mt-3 max-w-2xl leading-7 line-clamp-2">{cur.description}</p>
          <div className="flex flex-wrap gap-2 mt-4">
            <a href={cur.watchHref} className="btn-primary text-sm">▶ تماشا</a>
            <a href={cur.detailHref} className="btn-ghost text-sm !text-white" style={{ borderColor: 'rgba(255,255,255,.4)' }}>جزئیات</a>
          </div>
        </div>
        <div className="absolute top-4 end-4 flex gap-2">
          <button
            aria-label="اسلاید قبلی"
            onClick={() => setIdx((i) => (i - 1 + items.length) % items.length)}
            className="w-9 h-9 rounded-full text-white"
            style={{ background: 'rgba(0,0,0,.5)' }}
          >→</button>
          <button
            aria-label="اسلاید بعدی"
            onClick={() => setIdx((i) => (i + 1) % items.length)}
            className="w-9 h-9 rounded-full text-white"
            style={{ background: 'rgba(0,0,0,.5)' }}
          >←</button>
        </div>
        <div className="absolute bottom-4 end-5 flex gap-1.5" role="tablist" aria-label="انتخاب اسلاید">
          {items.map((it, i) => (
            <button
              key={it.slug}
              role="tab"
              aria-selected={i === idx}
              aria-label={`اسلاید ${i + 1}: ${it.titleFa}`}
              onClick={() => setIdx(i)}
              className="h-1.5 rounded-full"
              style={{ width: i === idx ? 28 : 12, background: i === idx ? 'var(--brand)' : 'rgba(255,255,255,.5)' }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function it_genres(cur: HeroItem): string {
  return cur.genres.slice(0, 3).join(' • ');
}
