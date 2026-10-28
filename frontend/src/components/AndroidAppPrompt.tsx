import { useRouterState } from "@tanstack/react-router";
import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";
import { APK, isAndroid } from "@/lib/app";
import { useLanguage } from "@/lib/LanguageContext";

const DISMISS_KEY = "sokolink-app-prompt-dismissed";
const SEEN_KEY = "sokolink-app-prompt-seen";
const DISMISS_DAYS = 7;
const HIDDEN_ON = ["/admin", "/vendor", "/login"];

function wasDismissed() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY) || 0);
    return Date.now() - at < DISMISS_DAYS * 86_400_000 || sessionStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function remember(key: string, storage: "local" | "session") {
  try {
    if (storage === "local") localStorage.setItem(key, String(Date.now()));
    else sessionStorage.setItem(key, "1");
  } catch {
    // storage blocked: the prompt just shows again next visit
  }
}

/**
 * Card that slides down from the top for Android visitors, offering the app.
 * It goes away when the visitor scrolls, closes it, or taps Install, and
 * stays away for the rest of the visit (a week after closing it).
 */
export function AndroidAppPrompt() {
  const { t } = useLanguage();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const blocked = HIDDEN_ON.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (blocked || !isAndroid() || wasDismissed()) return;
    const timer = setTimeout(() => setOpen(true), 1200);
    return () => clearTimeout(timer);
  }, [blocked]);

  // Scrolling the page tucks the card away for the rest of the visit.
  useEffect(() => {
    if (!open) return;
    const start = window.scrollY;
    const onScroll = () => {
      if (Math.abs(window.scrollY - start) > 60) {
        setOpen(false);
        remember(SEEN_KEY, "session");
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [open]);

  if (blocked) return null;

  const close = () => {
    setOpen(false);
    remember(DISMISS_KEY, "local");
  };

  return (
    <div
      role="dialog"
      aria-label={t("promptTitle")}
      aria-hidden={!open}
      className={`fixed inset-x-3 top-3 z-50 mx-auto max-w-md transition-all duration-500 ease-out ${
        open ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-[130%] opacity-0"
      }`}
    >
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-3 text-white shadow-2xl ring-1 ring-white/10">
        <div className="pointer-events-none absolute -right-10 -top-12 size-36 rounded-full bg-primary/40 blur-2xl" />
        <div className="relative flex items-center gap-3">
          <img
            src="/app-icon.png"
            alt=""
            width={52}
            height={52}
            className="size-[52px] shrink-0 rounded-[14px] shadow-lg ring-1 ring-white/20"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black">{t("promptTitle")}</p>
            <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-white/75">
              {t("promptText")}
            </p>
            <p className="mt-1 text-[10px] font-semibold text-white/50">
              {t("apkInfo")} · {APK.sizeMb} MB
            </p>
          </div>
          <a
            href={APK.url}
            download={APK.fileName}
            onClick={close}
            tabIndex={open ? 0 : -1}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-black text-white shadow-lg shadow-primary/40 transition active:scale-95"
          >
            <Download className="size-4" />
            {t("promptInstall")}
          </a>
          <button
            type="button"
            onClick={close}
            tabIndex={open ? 0 : -1}
            aria-label={t("promptClose")}
            className="-mr-1 grid size-8 shrink-0 place-items-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
