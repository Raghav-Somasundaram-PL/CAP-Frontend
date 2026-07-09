import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { APP_NAME } from "../../config/constants";

export function PortalDocumentMeta() {
  const { pathname } = useLocation();

  useEffect(() => {
    const isCandidatePortal = pathname.startsWith("/candidate");
    document.title = isCandidatePortal
      ? `${APP_NAME} | Candidate Portal`
      : `${APP_NAME} | Recruiter Portal`;
  }, [pathname]);

  return null;
}
