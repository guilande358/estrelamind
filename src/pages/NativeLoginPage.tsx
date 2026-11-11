import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { NATIVE_CALLBACK } from "@/lib/nativeAuth";

/** Opened in the phone's browser by the Android app; signs in with Google and hands the session back to the app. */
const NativeLoginPage = () => {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handBack = (access: string, refresh: string) => {
    window.location.href = `${NATIVE_CALLBACK}#access_token=${encodeURIComponent(access)}&refresh_token=${encodeURIComponent(refresh)}`;
  };

  const login = async () => {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/native-login`,
      extraParams: { prompt: "select_account" },
    });
    if (result.error) { setError(result.error.message); return; }
    if (result.redirected) return;
    const { data } = await supabase.auth.getSession();
    if (data.session) handBack(data.session.access_token, data.session.refresh_token);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) handBack(data.session.access_token, data.session.refresh_token);
      else setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) handBack(session.access_token, session.refresh_token);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 bg-background text-foreground">
      <h1 className="text-xl font-semibold">MindFlow</h1>
      {!ready ? (
        <Loader2 className="w-6 h-6 animate-spin" aria-label="A carregar" />
      ) : (
        <>
          <p className="text-muted-foreground text-center">Entre com a sua conta Google para voltar ao app.</p>
          <Button className="w-full max-w-xs h-12" onClick={login}>Continuar com Google</Button>
          {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
        </>
      )}
    </main>
  );
};

export default NativeLoginPage;
