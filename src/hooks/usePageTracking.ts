"use client";

import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { trackPageView } from "@/services/analytics";

export function usePageTracking() {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    trackPageView(location.pathname, user?.id);
  }, [location.pathname, user?.id]);
}