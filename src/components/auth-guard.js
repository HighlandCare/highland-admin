import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useRouter } from "next/router";
import Loader from "./Loader";
import {
  clearAuthSession,
  getAuthSessionState,
  isPublicPath,
  redirectToLogin,
} from "../utils/authSession";

export default function AuthGuard({ children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!router.isReady) {
      return undefined;
    }

    const pathname = router.pathname || "";

    if (isPublicPath(pathname)) {
      setReady(true);
      return undefined;
    }

    const sessionState = getAuthSessionState();

    if (sessionState === "expired") {
      // Hard-redirect before any protected page (e.g. dashboard) mounts.
      redirectToLogin({
        reason: "expired",
        nextPath: router.asPath && router.asPath !== "/" ? router.asPath : undefined,
      });
      return undefined;
    }

    if (sessionState === "missing") {
      clearAuthSession();
      const next = router.asPath && router.asPath !== "/" ? router.asPath : undefined;
      const query = next ? `?next=${encodeURIComponent(next)}` : "";
      router.replace(`/auth/login${query}`);
      return undefined;
    }

    setReady(true);
    return undefined;
  }, [router, router.isReady, router.pathname, router.asPath]);

  if (!router.isReady) {
    return <Loader />;
  }

  if (isPublicPath(router.pathname)) {
    return children;
  }

  // Keep showing the loader while auth is unresolved or while redirecting away.
  const sessionState = typeof window !== "undefined" ? getAuthSessionState() : "missing";
  if (!ready || sessionState !== "authenticated") {
    return <Loader />;
  }

  return children;
}

AuthGuard.propTypes = {
  children: PropTypes.node,
};
