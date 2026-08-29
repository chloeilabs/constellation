"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "sa-theme";

function subscribe(onStoreChange: () => void) {
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  window.addEventListener("storage", onStoreChange);
  return () => {
    observer.disconnect();
    window.removeEventListener("storage", onStoreChange);
  };
}

function getSnapshot() {
  return document.documentElement.classList.contains("dark");
}

function getServerSnapshot() {
  return false;
}

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {
      /* ignore quota / private mode */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="sa-icon-btn"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={dark}
      title={dark ? "Light mode" : "Dark mode"}
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
