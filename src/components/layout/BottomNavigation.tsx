import { Home, Calendar, Wallet, Mic, User } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useVoiceCapture } from "@/contexts/VoiceCaptureContext";

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

const NavItem = ({ to, icon, label, isActive }: NavItemProps) => (
  <NavLink
    to={to}
    className={cn(
      "flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-xl transition-all duration-200 touch-feedback min-w-[56px]",
      isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
    )}
  >
    <div className={cn("transition-transform duration-200", isActive && "scale-110")}>{icon}</div>
    <span className={cn("text-[11px] font-medium", isActive ? "opacity-100" : "opacity-70")}>{label}</span>
  </NavLink>
);

const BottomNavigation = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const { open, isOpen } = useVoiceCapture();

  const left = [
    { to: "/home", icon: <Home size={22} />, label: t("nav.home") },
    { to: "/agenda", icon: <Calendar size={22} />, label: t("nav.agenda") },
  ];
  const right = [
    { to: "/financas", icon: <Wallet size={22} />, label: t("nav.finances") },
    { to: "/perfil", icon: <User size={22} />, label: t("nav.profile") },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-bottom">
      <div className="relative flex items-center justify-between px-3 py-1 max-w-lg mx-auto">
        <div className="flex flex-1 justify-around">
          {left.map((i) => (
            <NavItem key={i.to} {...i} isActive={location.pathname === i.to} />
          ))}
        </div>

        {/* Central FAB */}
        <div className="relative w-20 flex justify-center">
          <button
            onClick={open}
            aria-label={t("offload.fabLabel")}
            className={cn(
              "absolute -top-8 w-16 h-16 rounded-full flex items-center justify-center text-white shadow-xl",
              "bg-gradient-to-br from-primary via-mindflow-zen to-primary",
              "transition-transform active:scale-95",
              "before:absolute before:inset-0 before:rounded-full before:bg-primary/40 before:animate-ping before:opacity-40",
              isOpen && "scale-110"
            )}
          >
            <span className="relative flex items-center justify-center">
              <Mic className="w-7 h-7 relative z-10" />
              {/* Sound wave bars */}
              <span className="absolute inset-0 flex items-center justify-center gap-[2px] opacity-40">
                <span className="w-[2px] h-2 bg-white rounded animate-pulse" style={{ animationDelay: "0ms" }} />
                <span className="w-[2px] h-3 bg-white rounded animate-pulse" style={{ animationDelay: "120ms" }} />
                <span className="w-[2px] h-4 bg-white rounded animate-pulse" style={{ animationDelay: "240ms" }} />
                <span className="w-[2px] h-3 bg-white rounded animate-pulse" style={{ animationDelay: "360ms" }} />
                <span className="w-[2px] h-2 bg-white rounded animate-pulse" style={{ animationDelay: "480ms" }} />
              </span>
            </span>
          </button>
        </div>

        <div className="flex flex-1 justify-around">
          {right.map((i) => (
            <NavItem key={i.to} {...i} isActive={location.pathname === i.to} />
          ))}
        </div>
      </div>
    </nav>
  );
};

export default BottomNavigation;
