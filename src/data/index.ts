import type { Genre, Actor, Title, TitleComment, Plan, Collection } from '../types';

export const genres: Genre[] = [
  { slug: 'drama', name: 'درام', description: 'داستان‌های عمیق انسانی و روابط پیچیده' },
  { slug: 'comedy', name: 'کمدی', description: 'فیلم‌ها و سریال‌های خنده‌دار و مفرح' },
  { slug: 'action', name: 'اکشن', description: 'هیجان، تعقیب و گریز و صحنه‌های نفس‌گیر' },
  { slug: 'romance', name: 'عاشقانه', description: 'قصه‌های عاشقانه و احساسی' },
  { slug: 'thriller', name: 'دلهره‌آور', description: 'تعلیق، معما و هیجان روان‌شناختی' },
  { slug: 'sci-fi', name: 'علمی‌تخیلی', description: 'آینده، فضا و فناوری' },
  { slug: 'fantasy', name: 'فانتزی', description: 'دنیاهای جادویی و موجودات افسانه‌ای' },
  { slug: 'horror', name: 'ترسناک', description: 'برای طرفداران هیجان و وحشت' },
  { slug: 'crime', name: 'جنایی', description: 'پرونده‌های جنایی و کارآگاهی' },
  { slug: 'family', name: 'خانوادگی', description: 'مناسب تماشای خانوادگی' },
  { slug: 'adventure', name: 'ماجراجویی', description: 'سفرهای پرماجرا و اکتشاف' },
  { slug: 'mystery', name: 'معمایی', description: 'گره‌های داستانی و رازهای پنهان' },
];

const P = (n: number) => `/images/posters/p${n}.svg`;
const B = (n: number) => `/images/backdrops/b${n}.svg`;
const A = (n: number) => `/images/actors/a${n}.svg`;

export const actors: Actor[] = [
  { slug: 'navid-mohammadi', name: 'نوید محمدی', latinName: 'Navid Mohammadi', photo: A(1), birthYear: 1365, birthPlace: 'تهران', bio: 'نوید محمدی بازیگر سینما و تلویزیون ایران است که با نقش‌آفرینی در درام‌های اجتماعی به شهرت رسید. او تاکنون در بیش از بیست فیلم سینمایی حضور داشته و دو بار نامزد دریافت سیمرغ بلورین شده است.' },
  { slug: 'sara-karimi', name: 'سارا کریمی', latinName: 'Sara Karimi', photo: A(2), birthYear: 1370, birthPlace: 'اصفهان', bio: 'سارا کریمی از بازیگران مطرح سینمای ایران است. او فعالیت خود را با تئاتر آغاز کرد و سپس وارد سینما شد. بازی‌های احساسی و دقیق او مورد تحسین منتقدان است.' },
  { slug: 'reza-ahmadi', name: 'رضا احمدی', latinName: 'Reza Ahmadi', photo: A(3), birthYear: 1358, birthPlace: 'مشهد', bio: 'رضا احمدی بازیگر و کارگردان ایرانی است که در ژانرهای اکشن و جنایی تخصص دارد. او علاوه بر بازیگری، در چند پروژه به‌عنوان مشاور هنری همکاری کرده است.' },
  { slug: 'niloofar-azizi', name: 'نیلوفر عزیزی', latinName: 'Niloofar Azizi', photo: A(4), birthYear: 1372, birthPlace: 'شیراز', bio: 'نیلوفر عزیزی با بازی در سریال‌های پرمخاطب تلویزیونی شناخته شد و سپس به سینما راه یافت. او یکی از پرکارترین بازیگران زن دهه اخیر است.' },
  { slug: 'amir-hosseini', name: 'امیر حسینی', latinName: 'Amir Hosseini', photo: A(5), birthYear: 1360, birthPlace: 'تبریز', bio: 'امیر حسینی بازیگر نقش‌های کمدی و درام است. توانایی او در ایفای نقش‌های متفاوت، او را به یکی از محبوب‌ترین چهره‌ها تبدیل کرده است.' },
  { slug: 'mahsa-rezaei', name: 'مهسا رضایی', latinName: 'Mahsa Rezaei', photo: A(6), birthYear: 1368, birthPlace: 'تهران', bio: 'مهسا رضایی فارغ‌التحصیل رشته سینما است و در آثار مستقل و جشنواره‌ای حضور پررنگی داشته است.' },
  { slug: 'hamid-naderi', name: 'حمید نادری', latinName: 'Hamid Naderi', photo: A(7), birthYear: 1355, birthPlace: 'اهواز', bio: 'حمید نادری از پیشکسوتان سینمای ایران است و در بیش از چهل فیلم ایفای نقش کرده است.' },
  { slug: 'elham-moradi', name: 'الهام مرادی', latinName: 'Elham Moradi', photo: A(8), birthYear: 1375, birthPlace: 'کرج', bio: 'الهام مرادی چهره جوان سینمای ایران است که با اولین نقش سینمایی خود جایزه بهترین بازیگر نوظهور را کسب کرد.' },
  { slug: 'babak-sharifi', name: 'بابک شریفی', latinName: 'Babak Sharifi', photo: A(9), birthYear: 1362, birthPlace: 'تهران', bio: 'بابک شریفی در ژانر علمی‌تخیلی و فانتزی شناخته می‌شود و در چند پروژه بین‌المللی نیز حضور داشته است.' },
  { slug: 'donya-farhad', name: 'دنیا فرهاد', latinName: 'Donya Farhad', photo: A(10), birthYear: 1371, birthPlace: 'رشت', bio: 'دنیا فرهاد بازیگر تئاتر و سینما است و صداپیشگی انیمیشن‌های محبوب را نیز در کارنامه دارد.' },
  { slug: 'kaveh-soleimani', name: 'کاوه سلیمانی', latinName: 'Kaveh Soleimani', photo: A(11), birthYear: 1359, birthPlace: 'کرمانشاه', bio: 'کاوه سلیمانی با نقش‌های منفی و پیچیده در سریال‌های جنایی به شهرت رسید.' },
  { slug: 'taraneh-mousavi', name: 'ترانه موسوی', latinName: 'Taraneh Mousavi', photo: A(12), birthYear: 1367, birthPlace: 'تهران', bio: 'ترانه موسوی بازیگر درام‌های عاشقانه است و در جشنواره‌های داخلی جوایز متعددی کسب کرده است.' },
  { slug: 'omid-jafari', name: 'امید جعفری', latinName: 'Omid Jafari', photo: A(13), birthYear: 1363, birthPlace: 'یزد', bio: 'امید جعفری کمدین و بازیگر سینماست که در برنامه‌های طنز تلویزیونی نیز حضور داشته است.' },
  { slug: 'shirin-nazari', name: 'شیرین نظری', latinName: 'Shirin Nazari', photo: A(14), birthYear: 1369, birthPlace: 'تهران', bio: 'شیرین نظری در آثار خانوادگی و کودک تخصص دارد و صداپیشه چند انیمیشن پرمخاطب است.' },
  { slug: 'farhad-alavi', name: 'فرهاد علوی', latinName: 'Farhad Alavi', photo: A(15), birthYear: 1352, birthPlace: 'ارومیه', bio: 'فرهاد علوی کارگردان و بازیگر پیشکسوت است که در چند دهه فعالیت، نقش‌های ماندگاری خلق کرده است.' },
];

type Raw = [slug: string, type: Title['type'], fa: string, en: string, year: number, genres: string[], imdb: number, director: string, country: string, desc: string];

const RAW: Raw[] = [
  ['shabhaye-roshan', 'movie', 'شب‌های روشن', 'Bright Nights', 1402, ['درام', 'عاشقانه'], 8.2, 'فرهاد علوی', 'ایران', 'داستان نویسنده‌ای که پس از سال‌ها به زادگاهش بازمی‌گردد و با خاطرات گذشته روبه‌رو می‌شود.'],
  ['parvaz-e-oghab', 'movie', 'پرواز عقاب', 'Eagle Flight', 1401, ['اکشن', 'ماجراجویی'], 7.4, 'رضا احمدی', 'ایران', 'یک خلبان جوان درگیر مأموریتی خطرناک می‌شود که سرنوشت کشور را تغییر می‌دهد.'],
  ['raz-e-jangal', 'movie', 'راز جنگل', 'Forest Secret', 1400, ['معمایی', 'دلهره‌آور'], 7.9, 'کاوه سلیمانی', 'ایران', 'گروهی از محققان در جنگل‌های شمال با پدیده‌ای مرموز روبه‌رو می‌شوند.'],
  ['khandehaye-shirin', 'movie', 'خنده‌های شیرین', 'Sweet Laughters', 1403, ['کمدی', 'خانوادگی'], 6.8, 'امید جعفری', 'ایران', 'یک خانواده پرجمعیت در تعطیلات نوروز با ماجراهای خنده‌داری روبه‌رو می‌شود.'],
  ['setareh-donbaleh-dar', 'movie', 'ستاره دنباله‌دار', 'The Comet', 1402, ['علمی‌تخیلی', 'درام'], 8.5, 'بابک شریفی', 'ایران', 'دانشمندی جوان عبور یک ستاره دنباله‌دار را فرصتی برای نجات زمین می‌داند.'],
  ['ghafas-e-shishei', 'movie', 'قفس شیشه‌ای', 'Glass Cage', 1399, ['جنایی', 'دلهره‌آور'], 8.0, 'حمید نادری', 'ایران', 'کارآگاهی بازنشسته برای حل آخرین پرونده‌اش به بازی خطرناکی قدم می‌گذارد.'],
  ['bahar-narenj', 'movie', 'بهار نارنج', 'Orange Spring', 1401, ['عاشقانه', 'درام'], 7.2, 'ترانه موسوی', 'ایران', 'قصه عشق دو جوان در باغ‌های بهارنارنج شیراز.'],
  ['saye-roshanaei', 'movie', 'سایه روشنایی', 'Light and Shadow', 1400, ['ترسناک', 'معمایی'], 6.5, 'کاوه سلیمانی', 'ایران', 'خانواده‌ای به خانه‌ای قدیمی نقل مکان می‌کنند و راز تاریک آن را کشف می‌کنند.'],
  ['jaddeh-abrisham', 'movie', 'جاده ابریشم', 'Silk Road', 1402, ['ماجراجویی', 'درام'], 7.8, 'فرهاد علوی', 'ایران', 'سفر حماسی کاروانی در جاده تاریخی ابریشم.'],
  ['mahtab', 'movie', 'مهتاب', 'Moonlight', 1398, ['درام', 'خانوادگی'], 8.1, 'مهسا رضایی', 'ایران', 'مادری فداکار برای نجات فرزندش از هیچ تلاشی دریغ نمی‌کند.'],
  ['toofan-e-shen', 'movie', 'طوفان شن', 'Sandstorm', 1403, ['اکشن', 'دلهره‌آور'], 7.1, 'رضا احمدی', 'ایران', 'گروهی امدادگر در دل طوفان شن به دنبال گمشده‌ها می‌گردند.'],
  ['gole-yakh', 'movie', 'گل یخ', 'Frost Flower', 1401, ['فانتزی', 'عاشقانه'], 7.6, 'دنیا فرهاد', 'ایران', 'دختری با قدرتی جادویی زمستانی ابدی را به شهر آورده است.'],
  ['gozargah', 'series', 'گذرگاه', 'The Passage', 1402, ['درام', 'جنایی'], 8.7, 'حمید نادری', 'ایران', 'سریال پرمخاطب درباره خانواده‌ای که درگیر شبکه فساد می‌شوند.'],
  ['emarat-khoshbakhti', 'series', 'عمارت خوشبختی', 'Mansion of Bliss', 1401, ['درام', 'عاشقانه'], 7.5, 'ترانه موسوی', 'ایران', 'زندگی سه نسل در یک عمارت قدیمی تهران.'],
  ['karagah-alavi', 'series', 'کارآگاه علوی', 'Detective Alavi', 1403, ['جنایی', 'معمایی'], 8.9, 'کاوه سلیمانی', 'ایران', 'کارآگاهی باهوش پرونده‌های پیچیده تهران را حل می‌کند.'],
  ['bagh-e-sib', 'series', 'باغ سیب', 'Apple Garden', 1400, ['خانوادگی', 'کمدی'], 7.0, 'امید جعفری', 'ایران', 'ماجراهای طنز ساکنان یک مجتمع مسکونی.'],
  ['aseman-tarik', 'series', 'آسمان تاریک', 'Dark Sky', 1402, ['علمی‌تخیلی', 'دلهره‌آور'], 8.4, 'بابک شریفی', 'ایران', 'پس از خاموشی جهانی برق، گروهی برای بقا تلاش می‌کنند.'],
  ['shahzadeh-bidar', 'series', 'شاهزاده بیدار', 'Awakened Prince', 1401, ['فانتزی', 'ماجراجویی'], 8.0, 'فرهاد علوی', 'ایران', 'شاهزاده‌ای که پس از صد سال خواب بیدار می‌شود.'],
  ['hamsayeha', 'series', 'همسایه‌ها', 'Neighbors', 1399, ['کمدی', 'خانوادگی'], 6.9, 'امید جعفری', 'ایران', 'رقابت بامزه دو خانواده همسایه.'],
  ['ghatel-khamosh', 'series', 'قاتل خاموش', 'Silent Killer', 1403, ['جنایی', 'دلهره‌آور'], 8.3, 'حمید نادری', 'ایران', 'پلیسی جوان در تعقیب قاتلی زنجیره‌ای است.'],
  ['jomeh-bazar', 'series', 'جمعه‌بازار', 'Friday Bazaar', 1400, ['درام', 'خانوادگی'], 7.3, 'مهسا رضایی', 'ایران', 'قصه کسبه یک بازار سنتی و روابطشان.'],
  ['parandeh-abi', 'series', 'پرنده آبی', 'Blue Bird', 1402, ['معمایی', 'درام'], 8.1, 'سارا کریمی', 'ایران', 'ناپدید شدن دختری جوان رازهای شهر کوچک را فاش می‌کند.'],
  ['jangal-sabz', 'animation', 'جنگل سبز', 'Green Jungle', 1402, ['خانوادگی', 'ماجراجویی'], 8.6, 'شیرین نظری', 'ایران', 'انیمیشن محبوب درباره حیوانات جنگل که برای نجات خانه‌شان متحد می‌شوند.'],
  ['safineh-fazaei', 'animation', 'سفینه فضایی', 'Spaceship', 1403, ['علمی‌تخیلی', 'ماجراجویی'], 8.2, 'بابک شریفی', 'ایران', 'ماجراجویی فضایی سه دوست کنجکاو.'],
  ['ezhdeha-koochooloo', 'animation', 'اژدهای کوچولو', 'Little Dragon', 1401, ['فانتزی', 'خانوادگی'], 9.0, 'دنیا فرهاد', 'ایران', 'اژدهای کوچکی که آتشش به جای سوزاندن، گل می‌سازد.'],
  ['donyaye-shirini', 'animation', 'دنیای شیرینی', 'Candy World', 1400, ['کمدی', 'خانوادگی'], 7.7, 'شیرین نظری', 'ایران', 'شهری ساخته‌شده از شیرینی که توسط بچه‌ها نجات می‌یابد.'],
  ['robot-mehraboon', 'animation', 'ربات مهربون', 'Kind Robot', 1402, ['علمی‌تخیلی', 'خانوادگی'], 8.8, 'امید جعفری', 'ایران', 'رباتی که احساسات انسانی را یاد می‌گیرد.'],
  ['mahi-girmizi', 'animation', 'ماهی قرمزی', 'Little Red Fish', 1399, ['ماجراجویی', 'خانوادگی'], 7.9, 'دنیا فرهاد', 'ایران', 'سفر ماهی کوچکی از رودخانه تا دریا.'],
  ['ghahremanan-kochak', 'animation', 'قهرمانان کوچک', 'Tiny Heroes', 1403, ['اکشن', 'کمدی'], 8.4, 'رضا احمدی', 'ایران', 'گروهی از بچه‌ها با قدرت‌های عجیب شهر را نجات می‌دهند.'],
  ['sarzamin-barf', 'animation', 'سرزمین برف', 'Snowland', 1401, ['فانتزی', 'ماجراجویی'], 8.0, 'شیرین نظری', 'ایران', 'دو خواهر در سرزمینی یخ‌زده به دنبال بهار می‌گردند.'],
  ['khers-ghahvei', 'animation', 'خرس قهوه‌ای', 'Brown Bear', 1400, ['خانوادگی', 'کمدی'], 7.4, 'امید جعفری', 'ایران', 'خرسی تنبل که نگهبان جنگل می‌شود.'],
  ['parvaneh-rangarang', 'animation', 'پروانه رنگارنگ', 'Colorful Butterfly', 1402, ['خانوادگی', 'فانتزی'], 8.1, 'دنیا فرهاد', 'ایران', 'پروانه‌ای که رنگ‌هایش را گم کرده است.'],
  ['del-aviz', 'movie', 'دل‌آویز', 'Beloved', 1397, ['درام', 'عاشقانه'], 7.8, 'ترانه موسوی', 'ایران', 'عشقی قدیمی پس از بیست سال دوباره زنده می‌شود.'],
  ['atash-neshan', 'movie', 'آتش‌نشان', 'Firefighter', 1402, ['اکشن', 'درام'], 7.7, 'رضا احمدی', 'ایران', 'فداکاری آتش‌نشانان در حادثه‌ای بزرگ.'],
  ['ketab-sargardan', 'movie', 'کتاب سرگردان', 'Wandering Book', 1401, ['معمایی', 'فانتزی'], 8.3, 'بابک شریفی', 'ایران', 'کتابی جادویی صاحبش را به دنیاهای مختلف می‌برد.'],
  ['sobh-bekheir-tehran', 'movie', 'صبح بخیر تهران', 'Good Morning Tehran', 1400, ['کمدی', 'خانوادگی'], 6.7, 'امید جعفری', 'ایران', 'یک روز پرماجرا در خیابان‌های تهران.'],
  ['mard-khakestari', 'movie', 'مرد خاکستری', 'Gray Man', 1403, ['جنایی', 'اکشن'], 8.6, 'حمید نادری', 'ایران', 'مأموری مخفی بین وفاداری و وجدان گیر کرده است.'],
  ['dokhtar-bahar', 'movie', 'دختر بهار', 'Spring Girl', 1399, ['عاشقانه', 'درام'], 7.0, 'سارا کریمی', 'ایران', 'دختری روستایی رویای خوانندگی را دنبال می‌کند.'],
  ['shekarchi', 'series', 'شکارچی', 'Hunter', 1401, ['اکشن', 'دلهره‌آور'], 7.9, 'رضا احمدی', 'ایران', 'شکارچی سابق حالا خودش شکار شده است.'],
  ['roya-park', 'series', 'رویاپارک', 'Dream Park', 1403, ['فانتزی', 'خانوادگی'], 8.5, 'دنیا فرهاد', 'ایران', 'شهربازی اسرارآمیزی که رویاها را واقعی می‌کند.'],
  ['ghandil', 'animation', 'قندیل', 'Icicle', 1403, ['فانتزی', 'ماجراجویی'], 8.9, 'شیرین نظری', 'ایران', 'قندیل کوچکی که می‌خواهد خورشید را ببیند.'],
  ['kast-even', 'movie', 'دشت آرام', 'Calm Plain', 1402, ['درام', 'خانوادگی'], 7.9, 'مهسا رضایی', 'ایران', 'بازگشت به روستا و آشتی با گذشته.'],
];

const CASTS: string[][] = [
  ['نوید محمدی', 'سارا کریمی', 'رضا احمدی'],
  ['رضا احمدی', 'کاوه سلیمانی', 'امیر حسینی'],
  ['نیلوفر عزیزی', 'کاوه سلیمانی', 'حمید نادری'],
  ['امیر حسینی', 'امید جعفری', 'شیرین نظری'],
  ['بابک شریفی', 'مهسا رضایی', 'نوید محمدی'],
  ['حمید نادری', 'کاوه سلیمانی', 'فرهاد علوی'],
];

function seasonsFor(slug: string, idx: number, isSeries: boolean): Title['seasons'] {
  if (!isSeries) return undefined;
  const count = (idx % 3) + 2;
  return Array.from({ length: count }, (_, s) => ({
    number: s + 1,
    episodes: Array.from({ length: 6 + ((idx + s) % 4) }, (_, e) => ({
      id: `${slug}-s${s + 1}e${e + 1}`,
      season: s + 1,
      number: e + 1,
      title: `قسمت ${['اول', 'دوم', 'سوم', 'چهارم', 'پنجم', 'ششم', 'هفتم', 'هشتم', 'نهم', 'دهم'][e] ?? String(e + 1)} فصل ${s + 1}`,
      durationMin: 35 + ((idx + e * 7) % 25),
      thumbnail: `/images/backdrops/b${((idx + e) % 8) + 1}.svg`,
      description: 'خلاصه این قسمت به‌زودی اضافه می‌شود.',
    })),
  }));
}

export const titles: Title[] = RAW.map((r, i) => {
  const [slug, type, titleFa, titleEn, jy, genreNames, imdb, director, country, description] = r;
  const isSeries = type === 'series';
  const seasons = seasonsFor(slug, i, isSeries);
  const episodesCount = seasons ? seasons.reduce((a, s) => a + s.episodes.length, 0) : null;
  const month = String((i % 12) + 1).padStart(2, '0');
  const day = String((i % 27) + 1).padStart(2, '0');
  const addedAt = `2024-${month}-${day}`;
  return {
    slug,
    type,
    titleFa,
    titleEn,
    year: jy - 621 < 2020 ? jy : jy + 621 - 621,
    jalaliYear: jy,
    runtimeMin: type === 'movie' ? 85 + ((i * 13) % 60) : isSeries ? null : 75 + ((i * 11) % 30),
    seasonsCount: seasons ? seasons.length : null,
    episodesCount,
    countries: [country],
    genres: genreNames,
    director,
    cast: CASTS[i % CASTS.length],
    description,
    imdb,
    siteScore: Math.min(10, Math.round((imdb + 0.3) * 10) / 10),
    ageRating: imdb >= 8 ? '+۱۲' : '+۷',
    quality: i % 3 === 0 ? '۱۰۸۰p' : i % 3 === 1 ? '۷۲۰p' : '۴۸۰p',
    dubbed: i % 2 === 0,
    subtitled: true,
    poster: P((i % 12) + 1),
    backdrop: B((i % 8) + 1),
    views: 50_000 + i * 47_000 + ((i * 7919) % 300_000),
    addedAt,
    featured: i < 6,
    top10Rank: i < 10 ? i + 1 : undefined,
    ageGroup: type === 'animation' ? (['کودک', 'نوجوان', 'خانواده'] as const)[i % 3] : undefined,
    language: i % 5 === 0 ? 'انگلیسی' : 'فارسی',
    seasons,
  } as Title;
});

export const comments: TitleComment[] = titles.slice(0, 20).flatMap((t, i) => [
  {
    id: `${t.slug}-c1`,
    titleSlug: t.slug,
    author: ['علی رضایی', 'مریم حسینی', 'جواد کریمی'][i % 3],
    avatar: `/images/actors/a${(i % 15) + 1}.svg`,
    date: '2024-08-10',
    rating: 8 + (i % 3),
    text: `واقعا از تماشای «${t.titleFa}» لذت بردم. داستان قوی و بازی‌ها عالی بود. پیشنهاد می‌کنم حتما ببینید.`,
    likes: 10 + i * 3,
  },
  {
    id: `${t.slug}-c2`,
    titleSlug: t.slug,
    author: ['سارا محمدی', 'حسین نادری'][i % 2],
    avatar: `/images/actors/a${((i + 5) % 15) + 1}.svg`,
    date: '2024-09-02',
    rating: 7 + (i % 2),
    text: 'کیفیت پخش عالی بود و دوبله فارسی خیلی تمیز انجام شده. ممنون از مووی‌تون.',
    likes: 4 + i,
  },
]);

export const plans: Plan[] = [
  { id: 'monthly', name: 'ماهانه', priceMonthly: 89000, priceYearly: 89000 * 12, features: ['تماشای نامحدود', 'کیفیت تا ۱۰۸۰p', 'یک دستگاه همزمان', 'پشتیبانی'], },
  { id: 'six', name: 'شش‌ماهه', priceMonthly: 79000, priceYearly: 474000, features: ['تماشای نامحدود', 'کیفیت تا ۴K', 'دو دستگاه همزمان', 'دانلود آفلاین', 'بدون تبلیغات'], highlighted: true, },
  { id: 'yearly', name: 'سالانه', priceMonthly: 59000, priceYearly: 708000, features: ['تماشای نامحدود', 'کیفیت تا ۴K', 'چهار دستگاه همزمان', 'دانلود آفلاین', 'بدون تبلیغات', 'پشتیبانی ویژه'], },
];

export const collections: Collection[] = [
  { slug: 'night-drama', name: 'شب‌های درام', description: 'بهترین درام‌های ایرانی برای شب‌های آرام', cover: B(1), titleSlugs: titles.filter((t) => t.genres.includes('درام')).slice(0, 8).map((t) => t.slug) },
  { slug: 'family-weekend', name: 'آخر هفته خانوادگی', description: 'انیمیشن‌ها و فیلم‌های مناسب خانواده', cover: B(2), titleSlugs: titles.filter((t) => t.type === 'animation').slice(0, 8).map((t) => t.slug) },
  { slug: 'crime-nights', name: 'شب‌های جنایی', description: 'معمایی و جنایی برای عاشقان هیجان', cover: B(3), titleSlugs: titles.filter((t) => t.genres.includes('جنایی')).slice(0, 8).map((t) => t.slug) },
];

export function getTitle(slug: string): Title | undefined {
  return titles.find((t) => t.slug === slug);
}

export function getActor(slug: string): Actor | undefined {
  return actors.find((a) => a.slug === slug);
}

export function actorTitles(actorName: string): Title[] {
  return titles.filter((t) => t.cast.includes(actorName) || t.director === actorName);
}

export function genreName(slug: string): string {
  return genres.find((g) => g.slug === slug)?.name ?? slug;
}
