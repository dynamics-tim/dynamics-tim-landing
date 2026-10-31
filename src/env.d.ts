import '../.astro/types.d.ts';
import 'astro/client';

declare global {
  /** Build-time environment variables (set as GitHub secrets/vars in deploy.yml). */
  interface ImportMetaEnv {
    /** Pushover visit notifications — both token and user must be set to enable */
    readonly PUBLIC_PUSHOVER_TOKEN?: string;
    readonly PUBLIC_PUSHOVER_USER?: string;
    readonly PUBLIC_PUSHOVER_TITLE?: string;
    readonly PUBLIC_PUSHOVER_MESSAGE?: string;
    /** GoatCounter endpoint, e.g. https://<code>.goatcounter.com/count (loaded after consent) */
    readonly PUBLIC_GOATCOUNTER_URL?: string;
  }
}
