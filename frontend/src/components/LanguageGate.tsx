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
        className="h-9 w-[3.375rem] rounded-md shadow-md ring-1 ring-white/30 sm:h-12 sm:w-[4.5rem]"
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
      className="h-9 w-[3.375rem] rounded-md shadow-md ring-1 ring-white/30 sm:h-12 sm:w-[4.5rem]"
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
      className={`fixed inset-0 z-[10000] flex items-center justify-center overflow-hidden px-4 transition-all duration-500 ${
        leaving ? "scale-105 opacity-0" : "opacity-100"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Choose your language"
    >
      {/* Background: deep navy with drifting orange glows */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-navy to-[#3b1306]" />
      <div className="lang-blob absolute -left-24 -top-24 size-[26rem] rounded-full bg-primary/30 blur-3xl" />
      <div
        className="lang-blob absolute -bottom-32 -right-20 size-[30rem] rounded-full bg-orange-500/20 blur-3xl"
        style={{ animationDelay: "-6s" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0,rgba(2,6,23,0.55)_75%)]" />

      <div className="relative w-full max-w-lg text-center">
        <div className="lang-rise mx-auto mb-6 inline-flex rounded-3xl bg-white/10 p-3 ring-1 ring-white/20 backdrop-blur">
          <BrandLogo className="size-16 rounded-2xl" />
        </div>
        <p
          className="lang-rise text-xs font-black uppercase tracking-[0.3em] text-primary"
          style={{ animationDelay: "80ms" }}
        >
          Duka Magic Expressway
        </p>
        <div className="lang-rise relative mt-3 h-10 sm:h-12" style={{ animationDelay: "160ms" }}>
          {HEADINGS.map((text, i) => (
            <h1
              key={text}
              className={`absolute inset-0 text-3xl font-black text-white transition-all duration-700 sm:text-4xl ${
                i === heading ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
              }`}
            >
              {text}
            </h1>
          ))}
        </div>
        <p className="lang-rise mt-3 text-sm text-white/60" style={{ animationDelay: "240ms" }}>
          Anything you need, fast &amp; affordable · Chochote unachohitaji, haraka na kwa bei nafuu
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {OPTIONS.map((option, i) => {
            const isPicked = picked === option.lang;
            const isSaved = !picked && saved === option.lang;
            return (
              <button
                key={option.lang}
                type="button"
                onClick={() => choose(option.lang)}
                style={{ animationDelay: `${340 + i * 120}ms` }}
                className={`lang-rise group relative flex items-center gap-4 overflow-hidden rounded-2xl border p-4 text-left backdrop-blur transition-all duration-300 sm:flex-col sm:items-center sm:gap-3 sm:p-6 sm:text-center ${
                  isPicked
                    ? "scale-[1.03] border-primary bg-primary text-white shadow-2xl shadow-primary/40"
                    : picked
                      ? "scale-95 border-white/10 bg-white/5 opacity-40"
                      : "border-white/15 bg-white/10 text-white hover:-translate-y-1 hover:border-primary/70 hover:bg-white/15 hover:shadow-xl hover:shadow-primary/20"
                }`}
              >
                <span className="transition-transform duration-300 group-hover:scale-110">
                  <Flag lang={option.lang} />
                </span>
                <span className="flex-1">
                  <span className="block text-lg font-black">{option.name}</span>
                  <span className={`block text-xs ${isPicked ? "text-white/90" : "text-white/55"}`}>
                    {option.hint}
                  </span>
                </span>
                {isPicked ? (
                  <span className="grid size-8 place-items-center rounded-full bg-white text-primary sm:absolute sm:right-3 sm:top-3">
                    <Check className="size-5" />
                  </span>
                ) : (
                  <ChevronRight className="size-5 text-white/40 transition group-hover:translate-x-1 group-hover:text-primary sm:hidden" />
                )}
                {isSaved && (
                  <span className="absolute right-3 top-3 hidden rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold text-white/80 sm:block">
                    Last used
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <p className="lang-rise mt-6 text-[11px] text-white/40" style={{ animationDelay: "600ms" }}>
          You can change it any time from the top bar · Unaweza kubadilisha wakati wowote
        </p>
      </div>
    </div>
  );
}
