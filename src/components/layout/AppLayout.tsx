import { Outlet } from "react-router-dom";
import BottomNavigation from "./BottomNavigation";
import GuestBanner from "./GuestBanner";
import VoiceCaptureOverlay from "@/components/offload/VoiceCaptureOverlay";

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <GuestBanner />
      <main className="pb-24">
        <Outlet />
      </main>
      <BottomNavigation />
      <VoiceCaptureOverlay />
    </div>
  );
};

export default AppLayout;
