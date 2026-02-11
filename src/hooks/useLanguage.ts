import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { type SupportedLanguage, supportedLanguages } from '@/i18n';

export const useLanguage = () => {
  const { i18n } = useTranslation();

  const currentLanguage = (i18n.language || 'pt-BR') as SupportedLanguage;

  const setLanguage = useCallback(async (lang: SupportedLanguage) => {
    await i18n.changeLanguage(lang);
    localStorage.setItem('mindflow_language', lang);

    // Try to save to profile if logged in
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ language: lang } as any)
          .eq('user_id', user.id);
      }
    } catch {
      // Silently fail - localStorage is the primary store
    }
  }, [i18n]);

  const loadLanguageFromProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        const lang = (data as any)?.language;
        if (lang && supportedLanguages.includes(lang as SupportedLanguage)) {
          await i18n.changeLanguage(lang);
          localStorage.setItem('mindflow_language', lang);
        }
      }
    } catch {
      // Use detected/stored language
    }
  }, [i18n]);

  return {
    currentLanguage,
    setLanguage,
    loadLanguageFromProfile,
    supportedLanguages,
  };
};
