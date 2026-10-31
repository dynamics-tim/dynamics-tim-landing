import '../.astro/types.d.ts';
import 'astro/client';

declare global {
  /** Build-time environment variables (set as GitHub vars in deploy.yml). */
  interface ImportMetaEnv {
    /**
     * Base URL of the n8n lead endpoints (default: https://n8n.dynamics-tim.dev/webhook/dt-lead).
     * "off" disables the forms (they fall back to a pre-filled e-mail).
     */
    readonly PUBLIC_LEAD_API?: string;
    /** GoatCounter endpoint, e.g. https://<code>.goatcounter.com/count (loaded after consent) */
    readonly PUBLIC_GOATCOUNTER_URL?: string;
  }
}
