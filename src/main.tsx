import { registerNativeAuthListener } from "./lib/nativeAuth";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";

createRoot(document.getElementById("root")!).render(<App />);

registerNativeAuthListener(() => {
  const next = sessionStorage.getItem("mf_post_login_path") || "/home";
  sessionStorage.removeItem("mf_post_login_path");
  window.location.replace(next);
});
