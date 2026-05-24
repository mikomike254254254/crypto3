import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { LegacyDomainRedirect } from "./components/LegacyDomainRedirect";
import { registerPwaInstallPrompt } from "./lib/pwaInstall";
import { registerServiceWorker } from "./lib/deviceNotifications";
import { applyWallexSeo } from "./lib/seoHead";
import "./index.css";

applyWallexSeo();
registerPwaInstallPrompt();
registerServiceWorker();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <LegacyDomainRedirect />
    <App />
  </React.StrictMode>
);
