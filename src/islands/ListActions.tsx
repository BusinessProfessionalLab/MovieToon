import { useEffect, useState } from 'react';
import { FAV_KEY, WATCH_KEY, inList, toggleInList } from '../lib/store';

export default function ListActions({ slug, title }: { slug: string; title: string }) {
  const [fav, setFav] = useState(false);
  const [watch, setWatch] = useState(false);

  useEffect(() => {
    setFav(inList(FAV_KEY, slug));
    setWatch(inList(WATCH_KEY, slug));
  }, [slug]);

  return (
    <div className="flex flex-wrap gap-2">
      <button
        className="btn-ghost text-sm"
        aria-pressed={fav}
        aria-label={fav ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
        onClick={() => {
          const next = toggleInList(FAV_KEY, slug);
          setFav(next.includes(slug));
          window.movietoonToast?.(next.includes(slug) ? `«${title}» به علاقه‌مندی‌ها اضافه شد` : `«${title}» از علاقه‌مندی‌ها حذف شد`);
        }}
      >{fav ? '❤️ در علاقه‌مندی‌ها' : '🤍 علاقه‌مندی'}</button>
      <button
        className="btn-ghost text-sm"
        aria-pressed={watch}
        aria-label={watch ? 'حذف از تماشای بعدی' : 'افزودن به تماشای بعدی'}
        onClick={() => {
          const next = toggleInList(WATCH_KEY, slug);
          setWatch(next.includes(slug));
          window.movietoonToast?.(next.includes(slug) ? `«${title}» به تماشای بعدی اضافه شد` : `«${title}» از تماشای بعدی حذف شد`);
        }}
      >{watch ? '🔖 در تماشای بعدی' : '🔖 تماشای بعدی'}</button>
    </div>
  );
}
