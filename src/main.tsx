import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { LegacyDomainRedirect } from "./components/LegacyDomainRedirect";
import { registerPwaInstallPrompt } from "./lib/pwaInstall";
import "./index.css";

registerPwaInstallPrompt();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <LegacyDomainRedirect />
    <App />
  </React.StrictMode>
);
