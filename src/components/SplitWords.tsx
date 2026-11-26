import { Fragment, type CSSProperties } from 'react';

/**
 * Text split into masked words for the slide-up reveal (styles in app/motion.css).
 * Words wrapped in *stars* get the accent gradient. Reads as plain text to screen readers.
 */
export function SplitWords({ text }: { text: string }) {
  const words = text.split(' ');
  return words.map((raw, i) => {
    const accent = /^\*.+\*\W*$/.test(raw);
    const word = raw.replace(/\*/g, '');
    return (
      <Fragment key={i}>
        <span className="word-mask">
          <span className={accent ? 'word word-accent' : 'word'} style={{ '--w': i } as CSSProperties}>
            {word}
          </span>
        </span>
        {i < words.length - 1 && ' '}
      </Fragment>
    );
  });
}
