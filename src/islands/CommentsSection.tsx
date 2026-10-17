import { useState } from 'react';

export interface CommentItem {
  id: string;
  author: string;
  avatar: string;
  date: string;
  rating: number;
  text: string;
  likes: number;
}

export default function CommentsSection({ initial, titleSlug }: { initial: CommentItem[]; titleSlug: string }) {
  const [items, setItems] = useState(initial);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError('لطفا نام خود را وارد کنید (حداقل ۲ حرف).');
      return;
    }
    if (text.trim().length < 5) {
      setError('متن دیدگاه باید حداقل ۵ حرف باشد.');
      return;
    }
    setError('');
    setItems((prev) => [
      { id: `local-${Date.now()}`, author: name.trim(), avatar: '/images/actors/a1.svg', date: 'امروز', rating: 8, text: text.trim(), likes: 0 },
      ...prev,
    ]);
    setName('');
    setText('');
    window.movietoonToast?.('دیدگاه شما با موفقیت ثبت شد');
  };

  return (
    <div>
      <form onSubmit={submit} className="card p-4 grid gap-3 mb-6" aria-label="ارسال دیدگاه">
        <h3 className="font-black">ثبت دیدگاه</h3>
        {error && <p role="alert" className="text-sm font-bold" style={{ color: 'var(--brand)' }}>{error}</p>}
        <div>
          <label htmlFor={`name-${titleSlug}`} className="text-sm font-bold block mb-1">نام</label>
          <input id={`name-${titleSlug}`} value={name} onChange={(e) => setName(e.target.value)} placeholder="مثلا: علی" className="w-full rounded-xl border px-3 py-2 text-sm" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }} />
        </div>
        <div>
          <label htmlFor={`text-${titleSlug}`} className="text-sm font-bold block mb-1">دیدگاه</label>
          <textarea id={`text-${titleSlug}`} value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="نظرتان را بنویسید…" className="w-full rounded-xl border px-3 py-2 text-sm" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }} />
        </div>
        <button type="submit" className="btn-primary text-sm w-fit">ارسال دیدگاه</button>
      </form>
      <ol className="grid gap-3">
        {items.map((c) => (
          <li key={c.id} className="card p-4">
            <div className="flex items-center gap-3">
              <img src={c.avatar} alt={`تصویر ${c.author}`} width="40" height="40" loading="lazy" className="rounded-full object-cover" />
              <div>
                <p className="font-bold text-sm">{c.author}</p>
                <p className="muted text-xs">{c.date} • ⭐ {String(c.rating).replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)])}</p>
              </div>
            </div>
            <p className="text-sm leading-7 mt-2">{c.text}</p>
          </li>
        ))}
        {items.length === 0 && <p className="muted text-sm">هنوز دیدگاهی ثبت نشده است. اولین نفر باشید!</p>}
      </ol>
    </div>
  );
}
