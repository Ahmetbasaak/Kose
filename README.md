# Köşe

Ekranın köşesinde duran küçük sayaç penceresi. Statik PWA: hesap yok, sunucu yok, veri yalnızca cihazda.
Çalışma adı geçicidir; marka adı, alan adı ve fiyat yer tutucuları `brand.config.json` içindedir.

## Komutlar

```bash
npm install
npm run dev        # geliştirme sunucusu
npm run check      # lint + prettier + tsc --noEmit + vitest
npm run build      # üretim paketi → dist/
npm run preview    # paketi yerelde sun
```

## Mimari

- `src/engine/` — saf zaman/hesap mantığı. Sayaçlar mutlak zaman damgalarından hesaplanır (`startedAt`, `accumulatedMs`), tik saymaz; sekme kısılsa ya da sayfa yenilense de doğru kalır. Testler: `tests/`.
- `src/storage/` — Zustand store'ları; aktif oturum localStorage'da kalıcı.
- `src/components/corner/` — Köşe penceresi: Document Picture-in-Picture (Chromium) varsa ayrı üstte kalan pencere, yoksa sayfa içi sürüklenebilir, köşeye yapışan widget.
- `src/modes/` — modlar ve kayıt defteri (`registry.ts`).
- `src/i18n/` — tüm arayüz metinleri (`tr.ts`).

Plan: `PLAN.md`. Kararlar: `DECISIONS.md`.

## Pro (geliştirme)

Pro özellikleri tek bir yetki katmanından (`src/app/entitlements.ts`, `useEntitlements()`) açılır. Ödeme sağlayıcısı henüz yok.
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

## Yayından önce yapılacaklar

- [ ] Resmî tatil/bayram verisini (`src/data/holidays.tr.json`, Faz 3) resmî kaynaktan doğrula; `"verified": false` kalan kayıt olmasın.
- [ ] Marka adı ve alan adı müsaitlik kontrolü; `brand.config.json` güncelle.
- [ ] Ödeme sağlayıcısını seç (Faz 7 adapter'ı).
- [ ] Gizlilik metnini hukukçuya incelet.
