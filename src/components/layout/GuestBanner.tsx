import { Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useGuest } from "@/contexts/GuestContext";

const GuestBanner = () => {
  const { isGuest } = useGuest();
  const { t } = useTranslation();

  if (!isGuest) return null;

  return (
    <div
      role="status"
      className="sticky top-0 z-40 flex items-start gap-2 bg-amber-500/15 text-foreground px-4 py-2 border-b border-amber-500/30"
    >
      <Info className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
      <p className="text-xs leading-snug">
        {t("guest.banner", {
          defaultValue:
            "Está em modo visitante — os seus dados não serão guardados depois desta sessão.",
        })}
      </p>
    </div>
  );
};

export default GuestBanner;
