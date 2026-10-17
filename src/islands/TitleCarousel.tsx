import { useRef } from 'react';

export default function TitleCarousel({ id, children }: { id: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    // RTL-aware: in RTL, scrollLeft behaves inversely; use scrollBy with direction compensation
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
  };
  return (
    <div className="title-carousel group/car relative" id={id}>
      <div
        ref={ref}
        className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1 md:px-1"
        tabIndex={0}
        aria-label="فهرست عناوین"
      >
        {children}
      </div>
      <button
        onClick={() => scroll(1)}
        aria-label="قبلی"
        className="carousel-arrow carousel-prev"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
          <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        onClick={() => scroll(-1)}
        aria-label="بعدی"
        className="carousel-arrow carousel-next"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <style>{`
        .carousel-arrow {
          position: absolute;
          top: 38%;
          z-index: 2;
          width: 2.4rem;
          height: 2.4rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          color: var(--text);
          background: color-mix(in srgb, var(--card) 88%, transparent);
          border: 1px solid var(--border);
          box-shadow: 0 8px 22px -10px rgba(0,0,0,.5);
          backdrop-filter: blur(8px);
          cursor: pointer;
          transition: opacity .25s ease, transform .25s ease, border-color .25s ease;
        }
        .carousel-arrow:hover { border-color: var(--brand); transform: scale(1.06); }
        .carousel-prev { inset-inline-start: .35rem; }
        .carousel-next { inset-inline-end: .35rem; }
        /* Desktop: reveal on hover/focus; touch: always visible. */
        @media (hover: hover) and (pointer: fine) {
          .carousel-arrow { opacity: 0; }
          .group\\/car:hover .carousel-arrow,
          .group\\/car:focus-within .carousel-arrow { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .carousel-arrow { transition: none; }
        }
      `}</style>
    </div>
  );
}
