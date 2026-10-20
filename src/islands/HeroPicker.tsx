import { useCallback, useEffect, useRef, useState } from 'react';
import { getTop10, listTitles, setHeroSlugs, setTop10Slugs, setHomeAnimationSlugs, type PageMeta } from '../lib/api';
import type { Title } from '../types';
import { toFa } from '../lib/fa';

type TypeFilter = '' | 'movie' | 'series' | 'animation';
const PAGE_SIZE = 12;

export type PickerKind = 'hero' | 'top10' | 'animation';

const TYPE_LABEL: Record<string, string> = { movie: 'فیلم', series: 'سریال', animation: 'انیمیشن' };

const KIND_CONFIG: Record<PickerKind, { cap: number; save: (slugs: string[]) => Promise<{ count: number }> }> = {
  hero: { cap: 30, save: setHeroSlugs },
  top10: { cap: 10, save: setTop10Slugs },
  animation: { cap: 30, save: setHomeAnimationSlugs },
};

export default function HeroPicker({ kind = 'hero' }: { kind?: PickerKind }) {
  const { cap, save: saveFn } = KIND_CONFIG[kind];
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [type, setType] = useState<TypeFilter>('');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Title[]>([]);
  const [meta, setMeta] = useState<PageMeta>({ page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [checkedTitles, setCheckedTitles] = useState<Map<string, Title>>(new Map());
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const searchTimer = useRef<number | null>(null);

  // Debounce search input (avoids a request per keystroke over 7k rows).
  useEffect(() => {
    if (searchTimer.current) window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(() => {
      setDebouncedQ(q.trim());
      setPage(1);
    }, 450);
    return () => {
      if (searchTimer.current) window.clearTimeout(searchTimer.current);
    };
  }, [q]);

  // Initial checked set = whatever is selected right now (per section kind).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data =
          kind === 'hero'
            ? (await listTitles({ featured: true, page: 1, pageSize: 30, sort: 'rating' })).data
            : kind === 'top10'
              ? await getTop10()
              : (await listTitles({ homeAnimation: true, page: 1, pageSize: 30, sort: 'rating' })).data;
        if (cancelled) return;
        setChecked(new Set(data.map((t) => t.slug)));
        setCheckedTitles(new Map(data.map((t) => [t.slug, t])));
      } catch {
        /* API down — start empty */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [kind]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await listTitles({
        q: debouncedQ || undefined,
        type: type || undefined,
        page,
        pageSize: PAGE_SIZE,
        sort: 'newest',
      });
      setItems(r.data);
      setMeta(r.meta);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, type, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = (t: Title) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(t.slug)) next.delete(t.slug);
      else {
        if (next.size >= cap) {
          window.movietoonToast?.(`حداکثر ${toFa(cap)} عنوان.`);
          return prev;
        }
        next.add(t.slug);
      }
      return next;
    });
    setCheckedTitles((prev) => {
      const next = new Map(prev);
      if (next.has(t.slug)) next.delete(t.slug);
      else next.set(t.slug, t);
      return next;
    });
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const r = await saveFn([...checked]);
      setDirty(false);
      window.movietoonToast?.(`${toFa(r.count)} عنوان ثبت شد.`);
    } catch (e) {
      window.movietoonToast?.(e instanceof Error ? e.message : 'خطا در ثبت.');
    } finally {
      setSaving(false);
    }
  };

  const selected = [...checkedTitles.values()].filter((t) => checked.has(t.slug));

  return (
    <div className="grid gap-4">
      {selected.length > 0 && (
        <div className="card p-3">
          <p className="font-bold text-sm mb-2">انتخاب‌شده‌ها ({toFa(selected.length)})</p>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {selected.map((t) => (
              <button
                key={t.slug}
                type="button"
                onClick={() => toggle(t)}
                className="relative shrink-0"
                title={`${t.titleFa} — کلیک برای حذف`}
                aria-label={`حذف ${t.titleFa} از Hero`}
              >
                <img src={t.poster} alt="" loading="lazy" width="56" height="84" className="rounded-lg object-cover w-14 h-[84px]" />
                <span className="absolute -top-1.5 -start-1.5 w-5 h-5 rounded-full text-[11px] text-white flex items-center justify-center" style={{ background: 'var(--brand)' }}>✕</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="سرچ عنوان، کارگردان..."
          className="rounded-xl border px-3 py-2 text-sm flex-1 min-w-[180px]"
          style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
          aria-label="سرچ عنوان"
        />
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value as TypeFilter);
            setPage(1);
          }}
          className="rounded-xl border px-3 py-2 text-sm"
          style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
          aria-label="فیلتر نوع"
        >
          <option value="">همه انواع</option>
          <option value="movie">فیلم</option>
          <option value="series">سریال</option>
          <option value="animation">انیمیشن</option>
        </select>
      </div>

      {loading ? (
        <p className="muted text-sm py-6 text-center">در حال بارگذاری...</p>
      ) : items.length === 0 ? (
        <p className="muted text-sm py-6 text-center">چیزی پیدا نشد.</p>
      ) : (
        <ul className="grid gap-2">
          {items.map((t) => {
            const on = checked.has(t.slug);
            return (
              <li key={t.slug}>
                <label className="card p-2.5 flex items-center gap-3 cursor-pointer hover:shadow-lg">
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => toggle(t)}
                    className="w-5 h-5 shrink-0 accent-pink-600"
                    aria-label={`انتخاب ${t.titleFa} برای Hero`}
                  />
                  <img src={t.poster} alt="" loading="lazy" width="40" height="60" className="rounded-lg object-cover w-10 h-[60px] shrink-0" />
                  <span className="flex-1 min-w-0">
                    <span className="font-bold text-sm block truncate">{t.titleFa}</span>
                    <span className="muted text-xs block truncate" dir="ltr" style={{ textAlign: 'right' }}>{t.titleEn}</span>
                    <span className="muted text-xs">
                      {TYPE_LABEL[t.type] ?? t.type} • {toFa(t.year)} • ⭐ {t.imdb}
                    </span>
                  </span>
                  {on && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white shrink-0" style={{ background: 'var(--brand)' }}>
                      Hero
                    </span>
                  )}
                </label>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          disabled={page <= 1 || loading}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="btn-ghost text-sm disabled:opacity-40"
        >
          → قبلی
        </button>
        <span className="muted text-xs">
          صفحه {toFa(meta.page)} از {toFa(meta.totalPages)} ({toFa(meta.total)} عنوان)
        </span>
        <button
          type="button"
          disabled={page >= meta.totalPages || loading}
          onClick={() => setPage((p) => p + 1)}
          className="btn-ghost text-sm disabled:opacity-40"
        >
          بعدی ←
        </button>
      </div>

      <button
        type="button"
        onClick={() => void save()}
        disabled={saving}
        className="btn-primary text-sm disabled:opacity-50"
      >
        {saving ? 'در حال ثبت...' : dirty ? `ثبت (${toFa(checked.size)} انتخاب)` : 'ثبت'}
      </button>
    </div>
  );
}
