import { useLayoutEffect, useState } from 'react';
import { Logo } from '../components/Logo';
import { SplitWords } from '../components/SplitWords';
import { brandName } from '../i18n';

const KEY = 'kose.intro';
const INTRO_MS = 1850;

function firstTimeThisTab() {
  try {
    if (sessionStorage.getItem(KEY)) return false;
    sessionStorage.setItem(KEY, '1');
  } catch {
    return false; // storage blocked: skip the show rather than replay it on every visit
  }
  return !matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Once per tab on the home page: the dial spins in, the name rises, a curtain lifts. Clicks pass straight through. */
export function Intro() {
  const [show, setShow] = useState(firstTimeThisTab);
  useLayoutEffect(() => {
    if (!show) return;
    const root = document.documentElement;
    root.style.setProperty('--intro-delay', '1.1s'); // the hero headline waits for the curtain
    const id = setTimeout(() => {
      setShow(false);
      root.style.removeProperty('--intro-delay');
    }, INTRO_MS);
    return () => clearTimeout(id);
  }, [show]);
  if (!show) return null;
  return (
    <div className="intro" aria-hidden="true">
      <span className="intro-mark">
        <Logo size={72} />
        <span>
          <SplitWords text={brandName} />
        </span>
      </span>
    </div>
  );
}
