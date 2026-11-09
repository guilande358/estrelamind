import type { CapacitorConfig } from "@capacitor/cli";

// Standalone build: the app bundles the web files from dist/.
// For live reload from the Lovable sandbox during development, temporarily add:
// server: { url: "https://dbfbb27b-78eb-446a-864c-d4dfa6f29fc6.lovableproject.com?forceHideBadge=true", cleartext: true }
const config: CapacitorConfig = {
  appId: "app.lovable.dbfbb27b78eb446a864cd4dfa6f29fc6",
  appName: "MindFlow",
  webDir: "dist",
  android: { allowMixedContent: false },
};

export default config;
