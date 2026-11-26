# Timekeepera

Ekranın köşesinde duran küçük sayaç penceresi. Statik PWA: hesap yok, sunucu yok, veri yalnızca cihazda.
Marka adı **Timekeepera** (Türkçe ve İngilizcede aynı). Logo: köşeleri belirgin çerçeve içinde saat ibreleri (`public/icon.svg`, `src/components/Logo.tsx`). Arayüz Türkçe ve İngilizce (`src/i18n/tr.ts`, `src/i18n/en.ts`); dil tarayıcıdan seçilir, Ayarlar'dan değişir. Marka adı, alan adı ve fiyat yer tutucuları `brand.config.json` içindedir.

## Kurulum

Node 22 gerekir.

```bash
npm install
npm run dev        # geliştirme sunucusu
npm run check      # lint + prettier + tsc --noEmit + vitest
npm run build      # üretim paketi → dist/
npm run preview    # paketi yerelde sun
npm run e2e        # Playwright: akışlar, çevrimdışı, axe erişilebilirlik taraması (açık/koyu)
```

## Ayarlar ve veriler

Ayarlar sayfası: tema (Sistem/Açık/Koyu, Pro'da Retro), hareketleri azalt, sekme başlığında sayaç, ses ve bildirim, başlatınca köşe penceresi, ekranı açık tut, köşe penceresi görünümü (Pro), kısayollar ve otomatik başlatma (Pro), **Verilerim** (JSON yedek indir/geri yükle, tümünü sil). Veriler cihazdan çıkmadığı için cihaz değiştirirken yedek dosyası kullanılır.

## PWA

`vite-plugin-pwa` ile kurulabilir ve ilk ziyaretten sonra çevrimdışı çalışır (uygulama kabuğu, Inter latin/latin-ext, ikonlar önbellekte). Yeni sürüm arka planda iner, sonraki açılışta devreye girer; çalışan sayaç durumu localStorage'da olduğu için güncellemeden etkilenmez.

## Mimari

- `src/engine/` — saf zaman/hesap mantığı. Sayaçlar mutlak zaman damgalarından hesaplanır (`startedAt`, `accumulatedMs`), tik saymaz; sekme kısılsa ya da sayfa yenilense de doğru kalır. Testler: `tests/`.
- `src/storage/` — Zustand store'ları; aktif oturum localStorage'da kalıcı.
- `src/components/corner/` — Köşe penceresi: Document Picture-in-Picture (Chromium) varsa ayrı üstte kalan pencere, yoksa sayfa içi sürüklenebilir, köşeye yapışan widget.
- `src/modes/` — modlar ve kayıt defteri (`registry.ts`).
- `src/app/` — router, kabuk, sayfalar, oturum görünümü (`sessionView.ts`), başlat/bitir eylemleri, Pro yetkisi (`entitlements.ts`) ve ödeme sınırı (`license.ts`).
- `src/i18n/` — tüm arayüz metinleri (`tr.ts`). Yeni dil = aynı şekilde yeni sözlük.
- `src/share/` — paylaşım kartı (canvas), haftalık özet, URL ile paylaşılan geri sayım ve OBS parametreleri.
- `src/export/` — Excel (`write-excel-file`, yalnızca dışa aktarırken yüklenir). PDF, tarayıcının yazdırma → PDF'i ile.
- `src/data/holidays.ts` — resmî tatiller her yıl için çevrimdışı hesaplanır: kanunla sabit günler kurala göre, Ramazan/Kurban Bayramı tarayıcının hicri takviminden (Ümmü'l-Kura; Diyanet'in 2023–2027 ilanlarıyla birebir aynı). Diyanet farklı bir tarih ilan ederse `src/data/holidays.tr.json` → `overrides`'a eklenir.
- Depolama: ayarlar, aktif oturum, geri sayımlar, serbest çalışan kayıtları localStorage'da; bitmiş oturum geçmişi IndexedDB'de. Hiçbiri cihazdan çıkmaz.

Plan: `PLAN.md`. Kararlar: `DECISIONS.md`.

## Pro ve ödeme

Pro özellikleri tek bir yetki katmanından (`src/app/entitlements.ts`, `useEntitlements()`) açılır. Fiyatlar `brand.config.json` → `pricing` (şimdilik `[FİYAT]` yer tutucusu); karşılaştırma tablosu `/fiyat`.

Ödeme sağlayıcısı henüz bağlı değil. Bağlamak için `src/app/license.ts` içinde bir `LicenseAdapter` yaz (`name`, `checkoutUrl`, `activate(key)`) ve `licenseAdapter`'a ata; arayüz (`/fiyat` lisans formu) hazır. Sunucu olmadığı için sağlayıcının tarayıcıdan çağrılabilen bir lisans doğrulama uç noktası olmalı (ör. Lemon Squeezy License API, Gumroad license verify). O alan adını CSP `connect-src`'ye ekle (`public/_headers`, `vercel.json`).

### Test modu (şu an açık)

`brand.config.json` → `"testMode": true` iken yayındaki sitede **herkes** tüm Pro özelliklerini görür; sayfanın üstünde "Test sürümü" notu çıkar. Pro satışa çıkmadan önce `false` yap.

### Geliştirmede Pro

Geliştirirken Pro'yu açmak için derleme sırasında bir anahtar ver ve uygulamayı `?gelistirici=<anahtar>` ile aç:

```bash
VITE_DEV_PRO_KEY=yerel-anahtar npm run dev
```

Anahtar istemci paketine gömülür; yalnızca geliştirme içindir. **Üretim derlemesinde `VITE_DEV_PRO_KEY` tanımlama.**

## Paylaşım ve yayıncı

- **Paylaşılan geri sayım:** `/sayim?ad=<başlık>&t=<unix saniye>`. Sunucu yok; linkte yalnızca başlık ve tarih var.
- **OBS "Browser Source":** `/overlay` — arka plan şeffaf, başlık/alt bilgi yok.

| Parametre   | Anlamı                                                  | Örnek          |
| ----------- | ------------------------------------------------------- | -------------- |
| `t`         | Bu ana kadar geri say (unix saniye)                     | `t=1812574800` |
| `sure`      | Sayfa açıldığından itibaren dakika geri say (`t` yoksa) | `sure=10`      |
| _(hiçbiri)_ | Sayfa açıldığından itibaren ileri say                   |                |
| `ad`        | Üstte küçük başlık (en çok 60 karakter)                 | `ad=Mola`      |
| `renk`      | Yazı rengi, `#` olmadan hex                             | `renk=ffcc00`  |
| `boyut`     | Rakam boyutu, piksel (16–400, varsayılan 96)            | `boyut=140`    |

Örnek: `/overlay?sure=10&ad=Mola&renk=ffffff&boyut=140`

## Dağıtım

Statik site: `npm run build` çıktısı `dist/`.

- **Cloudflare Workers (statik):** derleme komutu `npm run build`, deploy komutu `npx wrangler deploy`. `wrangler.jsonc` `dist`'i sunar ve bilinmeyen yolları `index.html`'e düşürür (SPA); `public/_headers` CSP, güvenlik ve önbellek başlıklarını verir. `_redirects` kullanma: Workers `/* /index.html 200` kuralını sonsuz döngü sayıp reddeder.
- **Cloudflare Pages:** derleme `npm run build`, çıktı `dist`; `404.html` olmadığı için SPA yönlendirmesi kendiliğinden çalışır, `_headers` aynen geçerli.
- **Vercel:** `vercel.json` aynı yönlendirme ve başlıkları içerir; çerçeve "Vite", çıktı `dist`.

İki dosyadaki CSP aynı olmalı; `npm run e2e` bunu ve uygulamanın bu CSP altında (PiP dahil) çalıştığını kontrol eder.

## Yayından önce yapılacaklar

- [ ] Her yıl Diyanet bayram tarihlerini ilan edince hesaplananla karşılaştır; fark varsa `src/data/holidays.tr.json` → `overrides`'a ekle (genelde gerekmez).
- [ ] Alan adını al ve `brand.config.json` → `domain`'e yaz (sitemap ve canonical bununla üretilir); marka tescili kontrolü.
- [ ] Google Search Console'a siteyi ve `sitemap.xml`'i ekle.
- [ ] Ödeme sağlayıcısını seç, `src/app/license.ts` adaptörünü yaz, fiyatları `brand.config.json` → `pricing`'e işle, sağlayıcının API alan adını CSP `connect-src`'ye ekle.
- [ ] Gizlilik metnini (`/gizlilik`, `src/i18n/tr.ts` → `privacy`) hukukçuya incelet (KVKK); `[YAYINDAN ÖNCE: …]` yer tutucularını doldur (barındırma ve ödeme sağlayıcısı).
- [ ] `brand.config.json` → `testMode`'u `false` yap (yoksa herkes Pro'yu bedava kullanır).
- [ ] Üretim derlemesinde `VITE_DEV_PRO_KEY` tanımlı olmadığını kontrol et.
- [ ] Gerçek Chrome/Edge'de köşe penceresini (PiP) ve bildirim iznini elle dene; telefonda PWA kurulumunu dene.
- [ ] `public/pwa-*.png` ikonlarını marka kesinleşince yeniden üret.
