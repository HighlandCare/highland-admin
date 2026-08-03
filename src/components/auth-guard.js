import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useRouter } from "next/router";
import Loader from "./Loader";
import { clearAuthSession, isAuthenticated, isPublicPath } from "../utils/authSession";

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

    if (!isAuthenticated()) {
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

  if (!ready) {
    return <Loader />;
  }

  return children;
}

AuthGuard.propTypes = {
  children: PropTypes.node,
};
