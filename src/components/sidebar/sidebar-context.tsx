"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export const SIDEBAR_STORAGE_KEY = "sidebarCollapsed";
const LEGACY_STORAGE_KEY = "sofismart-sidebar-collapsed";

type SidebarContextValue = {
  collapsed: boolean;
  mobileOpen: boolean;
  mounted: boolean;
  isMobile: boolean;
  isTablet: boolean;
  toggleCollapsed: () => void;
  setCollapsed: (value: boolean) => void;
  openMobile: () => void;
  closeMobile: () => void;
  toggleMobile: () => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

function readStoredCollapsed(width: number): boolean {
  try {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (stored !== null) return stored === "true";
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy === "1") return true;
    if (legacy === "0") return false;
  } catch {
    /* ignore */
  }
  return width >= 768 && width < 1024;
}

function persistCollapsed(value: boolean) {
  try {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(value));
    localStorage.setItem(LEGACY_STORAGE_KEY, value ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsedState] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [viewport, setViewport] = useState({ width: 1280, isMobile: false, isTablet: false });

  useEffect(() => {
    const update = () => {
      const width = window.innerWidth;
      setViewport({
        width,
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
      });
    };
    update();
    setCollapsedState(readStoredCollapsed(window.innerWidth));
    setMounted(true);
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (viewport.isMobile) setMobileOpen(false);
  }, [viewport.isMobile, mounted]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  const setCollapsed = useCallback((value: boolean) => {
    setCollapsedState(value);
    persistCollapsed(value);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsedState((prev) => {
      const next = !prev;
      persistCollapsed(next);
      return next;
    });
  }, []);

  const openMobile = useCallback(() => setMobileOpen(true), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const toggleMobile = useCallback(() => setMobileOpen((v) => !v), []);

  const value = useMemo(
    () => ({
      collapsed,
      mobileOpen,
      mounted,
      isMobile: viewport.isMobile,
      isTablet: viewport.isTablet,
      toggleCollapsed,
      setCollapsed,
      openMobile,
      closeMobile,
      toggleMobile,
    }),
    [
      collapsed,
      mobileOpen,
      mounted,
      viewport.isMobile,
      viewport.isTablet,
      toggleCollapsed,
      setCollapsed,
      openMobile,
      closeMobile,
      toggleMobile,
    ],
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}
