import { Home, Calendar, Wallet, Mic, User } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

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
      "flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-xl transition-all duration-200 touch-feedback min-w-[60px]",
      isActive
        ? "text-primary bg-primary/10"
        : "text-muted-foreground hover:text-foreground"
    )}
  >
    <div className={cn(
      "transition-transform duration-200",
      isActive && "scale-110"
    )}>
      {icon}
    </div>
    <span className={cn(
      "text-xs font-medium transition-all duration-200",
      isActive ? "opacity-100" : "opacity-70"
    )}>
      {label}
    </span>
  </NavLink>
);

const BottomNavigation = () => {
  const location = useLocation();
  const { t } = useTranslation();
  
  const navItems = [
    { to: "/home", icon: <Home size={22} />, label: t("nav.home") },
    { to: "/agenda", icon: <Calendar size={22} />, label: t("nav.agenda") },
    { to: "/financas", icon: <Wallet size={22} />, label: t("nav.finances") },
    { to: "/offload", icon: <Mic size={22} />, label: t("nav.offload") },
    { to: "/perfil", icon: <User size={22} />, label: t("nav.profile") },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-bottom">
      <div className="flex items-center justify-around px-2 py-1 max-w-lg mx-auto">
        {navItems.map((item) => (
          <NavItem
            key={item.to}
            {...item}
            isActive={location.pathname === item.to}
          />
        ))}
      </div>
    </nav>
  );
};

export default BottomNavigation;
