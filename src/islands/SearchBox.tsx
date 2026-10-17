import { useEffect, useMemo, useState } from 'react';

export interface SearchEntry {
  slug: string;
  titleFa: string;
  titleEn: string;
  type: string;
  year: number;
  poster: string;
  href: string;
}

export default function SearchBox({ data, initial = '' }: { data: SearchEntry[]; initial?: string }) {
  const [q, setQ] = useState(initial);
  const [open, setOpen] = useState(false);
  const [debounced, setDebounced] = useState(initial);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(q), 300);
    return () => window.clearTimeout(t);
  }, [q]);

  const results = useMemo(() => {
    const query = debounced.trim().toLowerCase();
    if (query.length < 2) return [];
    return data
      .filter((d) => `${d.titleFa} ${d.titleEn}`.toLowerCase().includes(query))
      .slice(0, 7);
  }, [debounced, data]);

  return (
    <div className="relative w-full">
      <form action="/search" method="get" role="search" className="flex gap-2">
        <label htmlFor="site-search" className="sr-only">جستجو</label>
        <input
          id="site-search"
          name="q"
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          placeholder="جستجوی فیلم، سریال، انیمیشن…"
          autoComplete="off"
          className="w-full rounded-xl border px-4 py-2.5 text-sm"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        />
        <button type="submit" className="btn-primary text-sm whitespace-nowrap" aria-label="جستجو">جستجو</button>
      </form>
      {open && debounced.trim().length >= 2 && (
        <div className="absolute top-full mt-2 inset-x-0 card shadow-xl overflow-hidden z-50" role="listbox" aria-label="نتایج زنده">
          {results.length === 0 && <p className="p-4 text-sm muted">نتیجه‌ای پیدا نشد.</p>}
          {results.map((r) => (
            <a key={r.slug} href={r.href} className="flex items-center gap-3 p-2.5 hover:opacity-80 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
              <img src={r.poster} alt="" width="36" height="54" className="rounded-md object-cover" loading="lazy" />
              <span className="text-sm font-bold">{r.titleFa}</span>
              <span className="muted text-xs ms-auto">{r.year}</span>
            </a>
          ))}
          {results.length > 0 && (
            <a href={`/search?q=${encodeURIComponent(debounced)}`} className="block p-3 text-center text-sm font-bold" style={{ color: 'var(--brand)' }}>
              مشاهده همه نتایج ←
            </a>
          )}
        </div>
      )}
    </div>
  );
}
