import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";

export const NATIVE_SCHEME = "mindflow";
export const NATIVE_CALLBACK = `${NATIVE_SCHEME}://auth/callback`;
export const WEB_ORIGIN = "https://flowmente.lovable.app";

export const isNativeApp = () => Capacitor.isNativePlatform();

/** Opens Google sign-in in the phone's system browser (Google blocks WebView logins). */
export async function startNativeGoogleLogin() {
  const { Browser } = await import("@capacitor/browser");
  await Browser.open({ url: `${WEB_ORIGIN}/native-login`, presentationStyle: "popover" });
}

/** Listens for mindflow://auth/callback#access_token=...&refresh_token=... and restores the session. */
export async function registerNativeAuthListener(onDone?: () => void) {
  if (!isNativeApp()) return;
  const { App } = await import("@capacitor/app");
  const { Browser } = await import("@capacitor/browser");
  await App.addListener("appUrlOpen", async ({ url }) => {
    if (!url.startsWith(NATIVE_CALLBACK)) return;
    const hash = url.split("#")[1] ?? url.split("?")[1] ?? "";
    const params = new URLSearchParams(hash);
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    try { await Browser.close(); } catch { /* already closed */ }
    if (access_token && refresh_token) {
      await supabase.auth.setSession({ access_token, refresh_token });
      onDone?.();
    }
  });
}
