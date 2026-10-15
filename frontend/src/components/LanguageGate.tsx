import { useEffect, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { Check, ChevronRight } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { useLanguage } from "@/lib/LanguageContext";
import type { Language } from "@/lib/i18n";

const ASKED_KEY = "duka-lang-asked"; // sessionStorage: asked once per visit
const SAVED_KEY = "mo-expressway-lang"; // same key LanguageContext saves to

const HEADINGS = ["Choose your language", "Chagua lugha yako"];

const OPTIONS: { lang: Language; name: string; hint: string }[] = [
  { lang: "sw", name: "Kiswahili", hint: "Endelea kwa Kiswahili" },
  { lang: "en", name: "English", hint: "Continue in English" },
];

/** SVG flags: emoji flags don't render on Windows. */
function Flag({ lang }: { lang: Language }) {
  if (lang === "sw") {
    return (
      <svg
        viewBox="0 0 72 48"
        className="h-10 w-[3.75rem] rounded-lg shadow-md ring-1 ring-white/30"
        aria-hidden="true"
      >
        <path fill="#1eb53a" d="M0 0h72L0 48z" />
        <path fill="#00a3dd" d="M72 0v48H0z" />
        <path stroke="#fcd116" strokeWidth="19" d="M0 48 72 0" />
        <path stroke="#000" strokeWidth="13" d="M0 48 72 0" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 60 40"
      className="h-10 w-[3.75rem] rounded-lg shadow-md ring-1 ring-white/30"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <clipPath id="uk-s">
        <path d="M0 0v40h60V0z" />
      </clipPath>
      <clipPath id="uk-t">
        <path d="M30 20h30v20zv20H0zH0V0zV0h30z" />
      </clipPath>
      <g clipPath="url(#uk-s)">
        <path fill="#012169" d="M0 0v40h60V0z" />
        <path stroke="#fff" strokeWidth="8" d="M0 0l60 40M60 0 0 40" />
        <path stroke="#C8102E" strokeWidth="5" d="M0 0l60 40M60 0 0 40" clipPath="url(#uk-t)" />
        <path stroke="#fff" strokeWidth="12" d="M30 0v40M0 20h60" />
        <path stroke="#C8102E" strokeWidth="7" d="M30 0v40M0 20h60" />
      </g>
    </svg>
  );
}

/** Pages for staff, where the welcome screen would only get in the way. */
const SKIP = ["/admin", "/vendor", "/login", "/register"];

/**
 * Welcome screen that asks for a language when the site opens (once per
 * visit). Rendered after hydration only, so server and browser HTML match.
 */
export function LanguageGate() {
  const { setLang } = useLanguage();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [picked, setPicked] = useState<Language | null>(null);
  const [saved, setSaved] = useState<Language | null>(null);
  const [heading, setHeading] = useState(0);

  useEffect(() => {
    if (SKIP.some((p) => pathname.startsWith(p))) return;
    try {
      if (sessionStorage.getItem(ASKED_KEY)) return;
      const stored = localStorage.getItem(SAVED_KEY);
      if (stored === "en" || stored === "sw") setSaved(stored);
    } catch {
      // Storage blocked: still ask, nothing is remembered.
    }
    setOpen(true);
    // Only on first load of the visit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Alternate the heading between both languages.
  useEffect(() => {
    if (!open) return;
    const timer = window.setInterval(() => setHeading((h) => (h + 1) % HEADINGS.length), 2200);
    return () => window.clearInterval(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  const choose = (choice: Language) => {
    if (picked) return;
    setPicked(choice);
    setLang(choice); // also saves it when it is already the active one
    try {
      sessionStorage.setItem(ASKED_KEY, "1");
    } catch {
      // ignore
    }
    window.setTimeout(() => setLeaving(true), 450);
    window.setTimeout(() => setOpen(false), 1050);
  };

  return (
    <div
      className={`fixed inset-0 z-[10000] overflow-y-auto bg-[#0a1f5c] transition-all duration-500 ${
        leaving ? "scale-[1.03] opacity-0" : "opacity-100"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Choose your language"
    >
      {/* The picture: full screen on wide screens (the right side is left free for the
          panel); on phones it sits on top and fades into the panel below. */}
      <div className="lang-zoom relative h-[46dvh] min-h-[260px] w-full overflow-hidden lg:fixed lg:inset-0 lg:h-full">
        <img
          src="/images/language-hero.jpg"
          alt="Shopping with Duka Magic Expressway"
          className="h-full w-full object-cover object-[28%_center] lg:object-left"
        />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0a1f5c] to-transparent lg:hidden" />
        <div className="absolute inset-y-0 right-0 hidden w-2/3 bg-gradient-to-l from-[#081a4d]/80 via-[#081a4d]/30 to-transparent lg:block" />
      </div>

      {/* Language panel */}
      <div className="relative z-10 flex justify-center px-4 pb-10 lg:absolute lg:inset-y-0 lg:right-0 lg:w-[48%] lg:items-center lg:px-10 lg:pb-0 xl:w-[44%]">
        <div className="-mt-10 w-full max-w-md lg:mt-0">
          <div className="lang-rise flex items-center gap-3">
            <BrandLogo className="size-12 rounded-2xl ring-2 ring-white/20" />
            <div>
              <p className="text-lg font-black leading-none text-white">
                Duka Magic <span className="text-primary">Expressway</span>
              </p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-white/50">
                Goods &amp; Services
              </p>
            </div>
          </div>

          <span
            className="lang-rise mt-8 inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-primary ring-1 ring-primary/30"
            style={{ animationDelay: "80ms" }}
          >
            <span className="size-1.5 animate-pulse rounded-full bg-primary" /> Welcome · Karibu
          </span>

          <div
            className="lang-rise relative mt-4 h-[5.5rem] sm:h-[7.25rem]"
            style={{ animationDelay: "160ms" }}
          >
            {HEADINGS.map((text, i) => (
              <h1
                key={text}
                className={`absolute inset-0 text-4xl font-black leading-[1.05] text-white transition-all duration-700 sm:text-5xl ${
                  i === heading
                    ? "translate-y-0 opacity-100 blur-0"
                    : "translate-y-4 opacity-0 blur-sm"
                }`}
              >
                {text.split(" ").slice(0, -1).join(" ")}{" "}
                <span className="bg-gradient-to-r from-primary to-amber-400 bg-clip-text text-transparent">
                  {text.split(" ").slice(-1)}
                </span>
              </h1>
            ))}
          </div>

          <div className="mt-7 space-y-3">
            {OPTIONS.map((option, i) => {
              const isPicked = picked === option.lang;
              const isSaved = !picked && saved === option.lang;
              return (
                <button
                  key={option.lang}
                  type="button"
                  onClick={() => choose(option.lang)}
                  style={{ animationDelay: `${340 + i * 120}ms` }}
                  className={`lang-rise group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl border p-4 text-left backdrop-blur-md transition-all duration-300 ${
                    isPicked
                      ? "scale-[1.02] border-primary bg-gradient-to-r from-primary to-orange-600 text-white shadow-2xl shadow-primary/40"
                      : picked
                        ? "scale-[0.98] border-white/10 bg-white/5 opacity-40"
                        : "border-white/15 bg-white/[0.07] text-white hover:-translate-y-0.5 hover:border-primary/70 hover:bg-white/[0.12] hover:shadow-xl hover:shadow-primary/20"
                  }`}
                >
                  <span className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-white/10 opacity-0 transition-all duration-700 group-hover:left-full group-hover:opacity-100" />
                  <span className="transition-transform duration-300 group-hover:scale-110">
                    <Flag lang={option.lang} />
                  </span>
                  <span className="flex-1">
                    <span className="flex items-center gap-2 text-lg font-black">
                      {option.name}
                      {isSaved && (
                        <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold text-white/80">
                          Last used
                        </span>
                      )}
                    </span>
                    <span
                      className={`block text-xs ${isPicked ? "text-white/90" : "text-white/55"}`}
                    >
                      {option.hint}
                    </span>
                  </span>
                  {isPicked ? (
                    <span className="grid size-9 place-items-center rounded-full bg-white text-primary">
                      <Check className="size-5" />
                    </span>
                  ) : (
                    <span className="grid size-9 place-items-center rounded-full bg-white/10 transition group-hover:bg-primary">
                      <ChevronRight className="size-5 text-white/70 transition group-hover:translate-x-0.5 group-hover:text-white" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
