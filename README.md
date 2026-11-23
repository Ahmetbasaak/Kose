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

## Yayından önce yapılacaklar

- [ ] Resmî tatil/bayram verisini (`src/data/holidays.tr.json`, Faz 3) resmî kaynaktan doğrula; `"verified": false` kalan kayıt olmasın.
- [ ] Marka adı ve alan adı müsaitlik kontrolü; `brand.config.json` güncelle.
- [ ] Ödeme sağlayıcısını seç (Faz 7 adapter'ı).
- [ ] Gizlilik metnini hukukçuya incelet.
