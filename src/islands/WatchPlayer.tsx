import { useEffect, useMemo, useRef, useState } from 'react';
import { getProgress, setProgress } from '../lib/store';
import type { DownloadLink } from '../types';

function fa(n: number | string): string {
  return String(n).replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
}

function playable(links: DownloadLink[]): DownloadLink[] {
  return (links ?? []).filter((l) => l.url && (l.type === 'traffic' || /\.m3u8($|\?)/.test(l.url) || /\.mp4($|\?)/.test(l.url)));
}

export default function WatchPlayer({
  slug,
  title,
  poster,
  links = [],
}: {
  slug: string;
  title: string;
  poster: string;
  links?: DownloadLink[];
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const files = useMemo(() => playable(links), [links]);
  const qualities = useMemo(() => [...new Set(files.map((f) => f.quality).filter(Boolean))], [files]);
  const [quality, setQuality] = useState<string>(() => qualities.find((q) => q.includes('1080')) ?? qualities[0] ?? '۱۰۸۰p');
  const [sub, setSub] = useState('فارسی');
  const [resumed, setResumed] = useState(false);

  const current = files.find((f) => f.quality === quality) ?? files[0];
  const src = current?.url;

  useEffect(() => {
    if (qualities.length > 0 && !qualities.includes(quality)) setQuality(qualities[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [links]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const saved = getProgress(slug);
    if (saved > 10) {
      const apply = () => {
        try {
          v.currentTime = Math.min(saved, (v.duration || saved + 1) - 5);
          setResumed(true);
        } catch { /* ignore */ }
      };
      if (v.readyState >= 1) apply();
      else v.addEventListener('loadedmetadata', apply, { once: true });
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
  }, [slug, src]);

  return (
    <div className="card overflow-hidden">
      <div className="relative bg-black">
        {src ? (
          <video
            ref={videoRef}
            key={src}
            controls
            preload="metadata"
            poster={poster}
            className="w-full aspect-video"
            aria-label={`پخش ${title}`}
          >
            <source src={src} type={src.includes('.m3u8') ? 'application/x-mpegURL' : 'video/mp4'} />
            مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.
          </video>
        ) : (
          <div className="w-full aspect-video flex items-center justify-center text-white text-sm p-8 text-center" aria-label="لینک پخش موجود نیست">
            لینک پخش این عنوان هنوز در دیتابیس ثبت نشده است. (ایمپورت seeko در حال تکمیل است.)
          </div>
        )}
        {resumed && (
          <p className="absolute top-3 start-3 text-xs px-3 py-1.5 rounded-lg text-white" style={{ background: 'rgba(0,0,0,.65)' }}>
            ▶ ادامه تماشا از دقیقه {fa(Math.floor(getProgress(slug) / 60))} — ذخیره‌شده در همین دستگاه
          </p>
        )}
      </div>
      <div className="p-4 flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <label htmlFor="q-sel" className="font-bold">کیفیت:</label>
          {qualities.length > 0 ? (
            <select id="q-sel" value={quality} onChange={(e) => setQuality(e.target.value)} className="rounded-lg border px-2 py-1.5" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
              {qualities.map((q) => <option key={q} value={q}>{q} {files.find((f) => f.quality === q)?.size ? `(${files.find((f) => f.quality === q)?.size})` : ''}</option>)}
            </select>
          ) : (
            <span className="muted text-xs">به‌زودی</span>
          )}
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
