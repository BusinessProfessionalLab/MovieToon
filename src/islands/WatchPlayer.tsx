import { useEffect, useRef, useState } from 'react';
import { getProgress, setProgress } from '../lib/store';

function fa(n: number | string): string {
  return String(n).replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
}

export default function WatchPlayer({ slug, title, poster }: { slug: string; title: string; poster: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [quality, setQuality] = useState('۱۰۸۰p');
  const [sub, setSub] = useState('فارسی');
  const [resumed, setResumed] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const saved = getProgress(slug);
    if (saved > 10) {
      v.currentTime = Math.min(saved, (v.duration || saved + 1) - 5);
      setResumed(true);
    }
    const onTime = () => setProgress(slug, v.currentTime);
    const onKey = (e: KeyboardEvent) => {
      if (!v) return;
      if (e.key === ' ' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        v.paused ? v.play() : v.pause();
      }
      if (e.key === 'ArrowLeft') v.currentTime += 10;
      if (e.key === 'ArrowRight') v.currentTime -= 10;
      if (e.key.toLowerCase() === 'f') (v.requestFullscreen?.() as unknown as void);
    };
    v.addEventListener('timeupdate', onTime);
    window.addEventListener('keydown', onKey);
    return () => {
      v.removeEventListener('timeupdate', onTime);
      window.removeEventListener('keydown', onKey);
    };
  }, [slug]);

  return (
    <div className="card overflow-hidden">
      <div className="relative bg-black">
        {/* Placeholder video: sample file (may 404 offline) + poster fallback */}
        <video
          ref={videoRef}
          controls
          preload="metadata"
          poster={poster}
          className="w-full aspect-video"
          aria-label={`پخش ${title}`}
        >
          <source src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" type="video/mp4" />
          مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.
        </video>
        {resumed && (
          <p className="absolute top-3 start-3 text-xs px-3 py-1.5 rounded-lg text-white" style={{ background: 'rgba(0,0,0,.65)' }}>
            ▶ ادامه تماشا از دقیقه {fa(Math.floor(getProgress(slug) / 60))} — ذخیره‌شده در همین دستگاه
          </p>
        )}
      </div>
      <div className="p-4 flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <label htmlFor="q-sel" className="font-bold">کیفیت:</label>
          <select id="q-sel" value={quality} onChange={(e) => setQuality(e.target.value)} className="rounded-lg border px-2 py-1.5" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
            {['۴۸۰p', '۷۲۰p', '۱۰۸۰p'].map((q) => <option key={q}>{q}</option>)}
          </select>
          <span className="muted text-xs">(نمایشی — کیفیت {quality} انتخاب شد)</span>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="s-sel" className="font-bold">زیرنویس:</label>
          <select id="s-sel" value={sub} onChange={(e) => setSub(e.target.value)} className="rounded-lg border px-2 py-1.5" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
            {['فارسی', 'انگلیسی', 'بدون زیرنویس'].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <p className="muted text-xs w-full">کلیدهای میانبر: فاصله (پخش/توقف) • جهت چپ/راست (۱۰ ثانیه جلو/عقب) • F (تمام‌صفحه)</p>
      </div>
    </div>
  );
}
