import { useEffect } from "react";
import { redirectLegacyHostIfNeeded } from "../utils/canonicalOrigin";

export function LegacyDomainRedirect() {
  useEffect(() => {
    redirectLegacyHostIfNeeded();
  }, []);

  return null;
}
