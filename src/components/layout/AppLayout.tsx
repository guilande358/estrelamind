import { Outlet } from "react-router-dom";
import BottomNavigation from "./BottomNavigation";

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="pb-20">
        <Outlet />
      </main>
      <BottomNavigation />
    </div>
  );
};

export default AppLayout;
