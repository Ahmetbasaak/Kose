# Köşe — Uygulama planı

Kaynak: `kose-claude-code-prompt.md` spesifikasyonu + Claude Design tuvali (6 ekran: Ana, Ayar, Köşe penceresi, Özet, Serbest çalışan, Mobil).
Küçük kararlar: `DECISIONS.md`. Her faz sonu: `npm run check` (lint + typecheck + test) + `npm run build` geçer, commit atılır, tıklanabilir sürüm olur.

## Mimari özeti

```
brand.config.json        Marka adı, alan adı, fiyat yer tutucuları (tek kaynak; Vite + uygulama okur)
src/
  app/        Router, kabuk (layout), tema CSS, config erişimi, global sayaç çalıştırıcı
  engine/     Saf zaman/hesap mantığı (UI yok, Date.now() parametre olarak gelir) — Vitest ile kapsamlı
  modes/      Her mod: ayar formu + canlı görünüm + kayıt (registry)
  components/ Ortak UI: CornerWindow (PiP + yedek widget), BigNumber, Button, Field …
  storage/    Zustand store'ları (localStorage persist) + IndexedDB (Dexie, Faz 5)
  i18n/       tr.ts (varsayılan), t() yardımcısı, tipli anahtarlar
  share/      Paylaşım kartı üretimi (canvas), paylaşılan link kodlama (Faz 4)
  export/     Excel/PDF (lazy-load, Faz 5)
  data/       holidays.tr.json (Faz 3)
public/       ikonlar, manifest varlıkları
tests/        engine testleri (+ Faz 6'da Playwright duman testi)
```

Doğruluk ilkesi: hiçbir sayaç tik sayarak birikmez. Durum = `{ startedAt, accumulatedMs }` (kronometre) ya da `{ targetAt, remainingMs }` (geri sayım); ekran her tikte `now` ile yeniden hesaplar. Aktif oturum localStorage'da kalıcı, yenilemede kaldığı yerden devam eder.

Köşe penceresi: `documentPictureInPicture` varsa React portal ile PiP penceresine render (aynı store, aynı ağaç; stiller kopyalanır; tik zamanlayıcısı PiP penceresinin kendi `setInterval`'ı ile çalışır ki ana sekme arka plandayken kısılmasın). Yoksa sayfa içinde sürüklenebilir, köşeye yapışan widget + bilgi notu. Dar ekranda (telefon) doğrudan tam sayfa sayaç.

## Fazlar

### Faz 0 — İskelet

- Vite + React 19 + TypeScript strict, React Router
- Stil: CSS değişkenleri (tema token'ları) + CSS Modules; açık/koyu (`prefers-color-scheme`), `prefers-reduced-motion`
- Inter (yerel paket, dış istek yok), `tabular-nums`
- i18n: `tr.ts` sözlük + tipli `t()`; marka adı config'den
- ESLint (flat) + Prettier + `tsc --noEmit` + Vitest; `npm run check`
- GitHub Actions CI betiği (check + build)
- Ana ekran: "Ne sayacağız?", mod kartları (Pro rozetli), "Verilerin yalnızca bu cihazda saklanır."

### Faz 1 — Zaman motoru, basit sayaç, Köşe penceresi

- `engine/`: kronometre, geri sayım, biçimlendirme (süre, ₺) + testler (duraklat/devam, yenileme sonrası devam, negatif/sınır durumlar)
- Basit sayaç / geri sayım modu: ayar formu + canlı önizleme + "Köşede başlat"
- Bitişte uyarı: Web Audio bip + Notification (izinle) + sayfa içi uyarı; yenilemede tekrar çalmaz
- Köşe penceresi: PiP (feature-detect) + yedek yüzen widget (sürükle, köşeye yapış, klavyeyle köşe değiştir) + bilgi notu
- PiP kapanınca sayaç ana sayfada sürer; `/sayac` tam sayfa canlı görünüm (mobil)
- "Bitir ve özeti gör" → basit özet ekranı (süre)

### Faz 2 — Mesai ve kazanç, özet ekranı

- `engine/work.ts`: net günlük saat, saat ücreti, kazanç; mesai öncesi / öğle arası (Mola) / mesai sonrası / hafta sonu; gece yarısı geçişi; Türkiye saati (UTC+3, DST yok) — kapsamlı testler
- Canlı kuruş akışı (hafif animasyon, reduced-motion'da kapalı), "tahmini" ibaresi ve brüt/net notu
- Özet ekranı: süre + kazanç kartları, çıktı butonları (Excel/PDF Pro kilitli), kart önizleme yeri

### Faz 3 — Geri sayımlar, toplantı maliyeti, mola, öğrenci

- Geri sayım şablonları (hafta sonu, maaş günü, bayram, tatil, doğum günü, özel), birden fazla, adlandırma
- `data/holidays.tr.json` — doğrulanmamış tarihler `"verified": false`; uydurma yok
- Toplantı maliyeti (canlı toplam + özet), mola hatırlatıcı (engellemeyen), Pomodoro + seri + sınav geri sayımı

### Faz 4 — Paylaşım

- Kart üretimi (canvas → PNG, 1080×1080 / 1080×1920), gizlilik varsayılanı (tutar gizli / yüzde / kahve parası)
- Haftalık "Köşe özeti" kartı (haftada bir, kapatılabilir)
- Paylaşılan geri sayım linki (URL parametresi, kişisel veri yok)
- `/overlay` OBS rotası (şeffaf arka plan, URL parametreleri)

### Faz 5 — Pro

- `useEntitlements()` yetki katmanı + geliştirici anahtarı
- Serbest çalışan sayacı (müşteri/proje, tek aktif, haftalık tablo, müşteri toplamı)
- Geçmiş (IndexedDB/Dexie) + aylık özet + filtre
- Excel (lazy-load) + PDF (yazdırma stili ya da lazy-load kütüphane)
- Temalar (retro LCD, neon, kâğıt, minimal), köşe penceresi ayarları, sunum sayacı, çoklu sayaç, kısayollar

### Faz 6 — PWA ve kalite

- `vite-plugin-pwa` (çevrimdışı, kurulabilir), paket boyutu bütçesi
- Erişilebilirlik denetimi (axe), kontrast, klavye; Playwright duman testi

### Faz 7 — Yayın hazırlığı

- Fiyat sayfası (config'den yer tutucu fiyatlar), lisans arayüzü + adapter sınırı (`license.ts`)
- Gizlilik sayfası taslağı, Cloudflare Pages / Vercel yapılandırması, README ("yayından önce yapılacaklar")

## Durum

Faz 0–7 tamamlandı. Ayrıntılar commit geçmişinde ve `DECISIONS.md`'de; yayın öncesi kalanlar README'deki listede.

## Faz 8 — Kapsam netleştirme (kullanıcı geri bildirimi)

### Genel temalar

- Ayarlar → Görünüm → Tema: **Sistem** (varsayılan, cihaz açık/koyu ayarını izler), **Açık**, **Koyu**, **Retro** (Pro; sıcak bej zemin, kiremit vurgu, eşit aralıklı yazı).
- Tema tüm uygulamaya uygulanır; köşe penceresi temaları (LCD, neon, kâğıt, minimal) ayrı kalır.

### Ayarlar (Toggl, Pomofocus, Flow gibi zaman takip uygulamalarındaki ortak ayarlar esas alındı)

- **Görünüm:** tema; hareketleri azalt (sistem / her zaman); sekme başlığında çalışan sayacı göster.
- **Ses ve bildirim:** ses açık/kapalı, ses seviyesi, ses tonu (zil, çan, bip) ve "Sesi dene"; bildirim izni durumu ve "İzin iste".
- **Sayaç davranışı:** "Başlatınca köşe penceresini aç" (kapalıysa tam sayfa sayaç açılır); "Sayaç çalışırken ekranı açık tut" (telefonda kilitlenmesin, Wake Lock).
- **Köşe penceresi (Pro):** tema, boyut, saydamlık, rakam boyutu (mevcut).
- **Kısayollar ve otomatik başlatma (Pro):** mevcut.
- **Verilerim:** yedeği indir (JSON), yedekten geri yükle, tüm verileri sil. Pro/lisans bilgisi yedeğe girmez.

### Serbest çalışan sayacı — nasıl çalışır

- Proje (ve müşterisi) bir kez tanımlanır; isteğe bağlı **saat ücreti** girilir.
- **Başlat** anından itibaren geçen her saniye sayılır; sayaç köşede de görünür. **Duraklat** ara verir (ara süre sayılmaz), **Devam et** sürdürür, **Durdur** işi bitirir ve süreyi o projeye **kayıt** olarak yazar.
- Aynı anda tek proje sayılır: başka projeyi başlatmak çalışanı durdurup kaydeder.
- Sayaç 8 saatten uzun süredir çalışıyorsa "durdurmayı unuttun mu?" uyarısı çıkar.
- Unutulan işler için **elle kayıt**: proje, tarih, başlangıç–bitiş saati, not.
- Haftalık rapor: kayıt listesi (silinebilir, notlu), gün/proje tablosu, müşteri başına süre ve (ücret girildiyse) **tutar**; Excel ve PDF.
- Proje silinebilir (kayıtlarıyla birlikte, onay sorulur).

## Açık sorular (kullanıcıya)

- Marka adı / alan adı (şimdilik "Köşe", `brand.config.json`)
- Ödeme sağlayıcısı ve fiyat
- Doğrulanmış resmî tatil verisi
