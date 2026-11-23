import type { CardContent } from './content';

export type CardSize = 'square' | 'story';
export const CARD_SIZES: Record<CardSize, [number, number]> = { square: [1080, 1080], story: [1080, 1920] };

// White text stays ≥ 4.5:1 on every tone.
const BG: Record<NonNullable<CardContent['tone']>, string> = {
  work: '#0F766E',
  meeting: '#9A3412',
  focus: '#3730A3',
  life: '#9F1239',
};
const FG = '#FFFFFF';
const SOFT = '#D5EEEA';
const DOT = '#FBBF24';
const FONT = "'Inter Variable', Inter, system-ui, sans-serif";

/** Shrink until the text fits the width. */
function fitFont(ctx: CanvasRenderingContext2D, text: string, weight: number, start: number, maxWidth: number) {
  let size = start;
  do {
    ctx.font = `${weight} ${size}px ${FONT}`;
    size -= 4;
  } while (ctx.measureText(text).width > maxWidth && size > 40);
}

/** Draws a card: kicker top-left, the corner motif top-right, the big number, lines, brand at the bottom. */
export async function drawCard(canvas: HTMLCanvasElement, c: CardContent, size: CardSize, brand: string) {
  await document.fonts.load(`700 100px ${FONT}`).catch(() => undefined);
  const [w, h] = CARD_SIZES[size];
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const pad = 96;
  const inner = w - pad * 2;

  ctx.fillStyle = BG[c.tone ?? 'work'];
  ctx.fillRect(0, 0, w, h);
  // Brand mark (public/icon.svg) top-right: corner frame and clock hands.
  const m = 120 / 64;
  ctx.save();
  ctx.translate(w - pad - 120, pad - 20);
  ctx.scale(m, m);
  ctx.lineWidth = 4.5;
  ctx.lineCap = 'round';
  ctx.strokeStyle = SOFT;
  for (const d of [
    'M12 22V15a3 3 0 0 1 3-3h7',
    'M42 12h7a3 3 0 0 1 3 3v7',
    'M52 42v7a3 3 0 0 1-3 3h-7',
    'M22 52h-7a3 3 0 0 1-3-3v-7',
    'M32 32V21',
  ])
    ctx.stroke(new Path2D(d));
  ctx.strokeStyle = DOT;
  ctx.stroke(new Path2D('M32 32l9 6'));
  ctx.fillStyle = SOFT;
  ctx.beginPath();
  ctx.arc(32, 32, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = SOFT;
  ctx.textBaseline = 'alphabetic';
  fitFont(ctx, c.kicker, 600, 48, inner - 170);
  ctx.fillText(c.kicker, pad, pad + 64);

  const bigY = size === 'story' ? h * 0.48 : h * 0.55;
  ctx.fillStyle = FG;
  fitFont(ctx, c.big, 700, size === 'story' ? 240 : 210, inner);
  ctx.fillText(c.big, pad, bigY);

  ctx.font = `500 46px ${FONT}`;
  c.lines.forEach((line, i) => {
    fitFont(ctx, line, 500, 46, inner);
    ctx.fillText(line, pad, bigY + 100 + i * 66);
  });

  ctx.fillStyle = SOFT;
  ctx.font = `700 44px ${FONT}`;
  ctx.fillText(brand, pad, h - pad);
}

export const cardBlob = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'),
  );
