# Kararlar

- Stil: Tailwind yerine CSS Modules + CSS değişkenleri — ek bağımlılık yok, PiP penceresine stil kopyalama basit.
- i18n: i18next yerine küçük tipli `t()` + `tr.ts` sözlüğü — tek dil için kütüphane gereksiz; EN eklemek = yeni sözlük dosyası.
- Marka/alan adı/fiyat: kökteki `brand.config.json`; hem uygulama hem `vite.config.ts` (HTML başlığı, ileride manifest) okur.
- Yazı tipi: `@fontsource-variable/inter` yerel paket — Google Fonts isteği yok (gizlilik + çevrimdışı).
- TypeScript 6.0 sabitlendi — typescript-eslint henüz TS 7'yi desteklemiyor (`<6.1.0`).
- Router: `react-router` v8 paketi (data router, `createBrowserRouter`).
- Durum: Zustand `persist` → localStorage; tek aktif oturum (çoklu sayaç Faz 5'te Pro).
- Tik: ekran yenileme `setInterval(250ms)` sadece yeniden çizim için; değer her zaman `Date.now()` ile mutlak damgadan hesaplanır.
- PiP açıkken tik, PiP penceresinin kendi zamanlayıcısıyla çalışır (ana sekme arka planda kısılsa da pencere akar).
- Köşe başlatma: PiP varsa PiP; yoksa dar ekranda (<640px) `/sayac` tam sayfa, geniş ekranda sayfa içi yüzen widget + bilgi notu.
- Yüzen widget klavye erişimi: sürükleme yerine "Köşeyi değiştir" butonu köşeler arasında döner; konum localStorage'da.
- Bitiş uyarısı oturum başına bir kez (`alertedAt`); sayfa kapalıyken bittiyse yeniden açılışta sadece sayfa içi uyarı, ses yok.
- Bildirim izni yalnızca geri sayım başlatılırken (kullanıcı hareketiyle) istenir.
- Playwright Faz 6'ya ertelendi; Faz 0–5 boyunca Vitest yalnızca `engine/`.
- PiP penceresindeki eylem düğmeleri 28px — pencere fareyle kullanılan masaüstü penceresi ve 140px yüksek; sayfa içi widget ve tüm sayfalarda 44px korunur.
- Faz 0 ve Faz 1 birbirine bağlı (router canlı/özet sayfalarını içeriyor) olduğundan tek commit'te teslim edildi; sonraki fazlar ayrı commit.
- Lint uyarıları da hata sayılır (`--max-warnings 0`).
