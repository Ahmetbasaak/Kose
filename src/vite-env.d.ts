/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Development-only Pro unlock key; leave unset in production. */
  readonly VITE_DEV_PRO_KEY?: string;
  /** '1' / '0' overrides brand.config.json testMode for one build. */
  readonly VITE_TEST_MODE?: string;
}
