import { useEffect, useState } from 'react';
import { inUserList, toggleUserList } from '../lib/api';

type ListKind = 'favorites' | 'watchlist';

export default function ListActions({ slug, title }: { slug: string; title: string }) {
  const [fav, setFav] = useState(false);
  const [watch, setWatch] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [f, w] = await Promise.all([inUserList('favorites' as ListKind, slug), inUserList('watchlist' as ListKind, slug)]);
      if (!cancelled) {
        setFav(f);
        setWatch(w);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const onToggle = async (kind: ListKind, label: string) => {
    const next = await toggleUserList(kind, slug);
    const on = next.includes(slug);
    if (kind === 'favorites') setFav(on);
    else setWatch(on);
    window.movietoonToast?.(on ? `«${title}» به ${label} اضافه شد` : `«${title}» از ${label} حذف شد`);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        className="btn-ghost text-sm"
        aria-pressed={fav}
        aria-label={fav ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
        onClick={() => void onToggle('favorites', 'علاقه‌مندی‌ها')}
      >{fav ? '❤️ در علاقه‌مندی‌ها' : '🤍 علاقه‌مندی'}</button>
      <button
        className="btn-ghost text-sm"
        aria-pressed={watch}
        aria-label={watch ? 'حذف از تماشای بعدی' : 'افزودن به تماشای بعدی'}
        onClick={() => void onToggle('watchlist', 'تماشای بعدی')}
      >{watch ? '🔖 در تماشای بعدی' : '🔖 تماشای بعدی'}</button>
    </div>
  );
}
