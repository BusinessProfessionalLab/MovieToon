import { useState } from 'react';

interface Ep {
  id: string;
  number: number;
  title: string;
  durationMin: number;
  thumbnail: string;
  description: string;
}
interface Season {
  number: number;
  episodes: Ep[];
}

function fa(n: number | string): string {
  return String(n).replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
}

export default function SeasonTabs({ seasons, watchBase }: { seasons: Season[]; watchBase: string }) {
  const [tab, setTab] = useState(0);
  if (!seasons.length) return null;
  const cur = seasons[Math.min(tab, seasons.length - 1)];
  return (
    <div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4" role="tablist" aria-label="فصل‌ها">
        {seasons.map((s, i) => (
          <button
            key={s.number}
            role="tab"
            aria-selected={i === tab}
            onClick={() => setTab(i)}
            className="px-4 py-2 rounded-xl text-sm font-bold border whitespace-nowrap"
            style={i === tab ? { background: 'var(--brand)', color: '#fff', borderColor: 'transparent' } : { borderColor: 'var(--border)' }}
          >فصل {fa(s.number)}</button>
        ))}
      </div>
      <ol className="grid gap-3 sm:grid-cols-2">
        {cur.episodes.map((e) => (
          <li key={e.id}>
            <a href={`${watchBase}?s=${cur.number}&e=${e.number}`} className="card flex gap-3 p-2.5 hover:shadow-lg transition-shadow">
              <img src={e.thumbnail} alt={e.title} width="160" height="90" loading="lazy" className="rounded-lg object-cover w-32 shrink-0" />
              <span className="py-1">
                <span className="font-bold text-sm block">قسمت {fa(e.number)}: {e.title.replace(/^قسمت .* فصل \d+$/, e.title)}</span>
                <span className="muted text-xs">⏱ {fa(e.durationMin)} دقیقه</span>
              </span>
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}
