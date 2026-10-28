import { CheckCircle2, ChevronDown, Download } from "lucide-react";
import type { ReactNode } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { APK } from "@/lib/app";
import appShowcase from "@/assets/app-showcase.jpg";

/**
 * Store links for the mobile apps. Leave a link empty until the app is
 * published - its button then shows a "Coming soon" tag instead of linking.
 */
const APP_LINKS = {
  googlePlay: "",
  appStore: "",
};

function GooglePlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-7" aria-hidden="true">
      <path fill="#34A853" d="M3.6 1.8 13.8 12 3.6 22.2c-.4-.2-.6-.7-.6-1.2V3c0-.5.2-1 .6-1.2Z" />
      <path fill="#FBBC04" d="m17.2 8.6-3.4 3.4 3.4 3.4 3.8-2.2c.9-.5.9-1.9 0-2.4l-3.8-2.2Z" />
      <path fill="#4285F4" d="M3.6 22.2 13.8 12l3.4 3.4L5.3 22.2c-.6.3-1.2.3-1.7 0Z" />
      <path fill="#EA4335" d="M3.6 1.8c.5-.3 1.1-.3 1.7 0l11.9 6.8-3.4 3.4L3.6 1.8Z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-7" aria-hidden="true">
      <path
        fill="currentColor"
        d="M16.4 12.6c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.1 1-4 2.4-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8 1.5 0 1.9.8 3.2.8 1.3 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.3-2.8-.1 0-2.5-1-2.5-3.9ZM14 5.4c.7-.8 1.1-1.9 1-3-.9 0-2.1.6-2.8 1.4-.6.7-1.2 1.8-1 2.9 1.1.1 2.1-.5 2.8-1.3Z"
      />
    </svg>
  );
}

export function AndroidIcon({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#3DDC84"
        d="M17.6 9.48 19.44 6.3a.38.38 0 1 0-.66-.38l-1.87 3.23a11.4 11.4 0 0 0-9.82 0L5.22 5.92a.38.38 0 1 0-.66.38L6.4 9.48A10.8 10.8 0 0 0 1 18h22a10.8 10.8 0 0 0-5.4-8.52ZM7 15.25a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm10 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"
      />
    </svg>
  );
}

/** The main "Download for Android" button (direct APK until Play is live). */
function ApkButton() {
  const { t } = useLanguage();
  return (
    <a
      href={APK.url}
      download={APK.fileName}
      className="group relative inline-flex h-16 items-center gap-3 rounded-2xl bg-white pl-4 pr-5 text-slate-900 shadow-xl ring-1 ring-black/5 transition duration-300 hover:-translate-y-0.5 hover:shadow-2xl"
    >
      <span className="grid size-11 place-items-center rounded-xl bg-slate-900">
        <AndroidIcon />
      </span>
      <span className="flex flex-col text-left leading-none">
        <span className="text-[10px] font-bold tracking-wide text-slate-500">{t("apkPre")}</span>
        <span className="mt-1 text-lg font-black tracking-tight">Android</span>
        <span className="mt-1 text-[11px] font-semibold text-slate-500">
          {t("apkInfo")} · v{APK.version} · {APK.sizeMb} MB
        </span>
      </span>
      <Download className="ml-2 size-5 text-primary transition group-hover:translate-y-0.5" />
    </a>
  );
}

function StoreBadge({
  href,
  icon,
  pre,
  name,
  comingSoon,
}: {
  href: string;
  icon: ReactNode;
  pre: string;
  name: string;
  comingSoon: string;
}) {
  const body = (
    <>
      {icon}
      <span className="flex flex-col text-left leading-none">
        <span className="text-[10px] font-semibold tracking-wide text-white/75">{pre}</span>
        <span className="mt-1 text-lg font-bold tracking-tight">{name}</span>
      </span>
      {!href && (
        <span className="absolute -right-2 -top-2 rounded-full bg-amber-300 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-slate-900 shadow">
          {comingSoon}
        </span>
      )}
    </>
  );
  const className =
    "relative inline-flex h-14 min-w-[180px] items-center gap-3 rounded-xl bg-slate-950 px-4 text-white shadow-lg ring-1 ring-white/10 transition duration-300";
  return href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${className} hover:-translate-y-0.5 hover:bg-black hover:shadow-xl`}
    >
      {body}
    </a>
  ) : (
    <span className={`${className} cursor-default opacity-95`} aria-disabled="true">
      {body}
    </span>
  );
}

/** Home page section inviting shoppers to download the mobile app. */
export function AppDownloadSection() {
  const { t } = useLanguage();
  const features = [t("appFeature1"), t("appFeature2"), t("appFeature3")];

  return (
    <section
      id="app"
      aria-labelledby="app-title"
      className="relative mt-10 overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-orange-500 to-amber-500 px-4 py-10 text-white shadow-xl sm:px-8 lg:px-12 lg:py-14"
    >
      {/* Decorative shapes */}
      <div className="pointer-events-none absolute -left-20 -top-20 size-72 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-24 right-1/3 size-80 rounded-full bg-orange-700/30 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.12)_1px,transparent_0)] [background-size:22px_22px]" />

      <div className="relative mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-[1fr_1.1fr]">
        {/* Copy */}
        <div className="text-center md:text-left">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ring-1 ring-white/25">
            <span className="size-1.5 rounded-full bg-white" /> {t("appEyebrow")}
          </p>
          <h2 id="app-title" className="mt-4 text-3xl font-black leading-tight sm:text-4xl">
            {t("appTitle")}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/85 sm:text-base">
            {t("appSubtitle")}
          </p>

          <ul className="mt-6 space-y-2.5 text-left md:max-w-sm">
            {features.map((feature) => (
              <li key={feature} className="flex items-center gap-2.5 text-sm font-semibold">
                <CheckCircle2 className="size-5 shrink-0 text-white" />
                {feature}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex justify-center md:justify-start">
            <ApkButton />
          </div>

          <details className="group mx-auto mt-4 max-w-sm rounded-xl bg-white/10 text-left ring-1 ring-white/20 md:mx-0">
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-2.5 text-sm font-bold [&::-webkit-details-marker]:hidden">
              {t("apkHowTitle")}
              <ChevronDown className="size-4 transition group-open:rotate-180" />
            </summary>
            <ol className="space-y-2 px-4 pb-4 text-sm text-white/90">
              {[t("apkStep1"), t("apkStep2"), t("apkStep3")].map((step, i) => (
                <li key={step} className="flex gap-2.5">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-white text-[11px] font-black text-primary">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
              <li className="pt-1 text-xs text-white/75">{t("apkNote")}</li>
            </ol>
          </details>

          <div className="mt-5 flex flex-wrap justify-center gap-3 md:justify-start">
            <StoreBadge
              href={APP_LINKS.googlePlay}
              icon={<GooglePlayIcon />}
              pre={t("appGooglePre")}
              name="Google Play"
              comingSoon={t("appComingSoon")}
            />
            <StoreBadge
              href={APP_LINKS.appStore}
              icon={<AppleIcon />}
              pre={t("appApplePre")}
              name="App Store"
              comingSoon={t("appComingSoon")}
            />
          </div>
        </div>

        {/* The app on two phones */}
        <div className="md:justify-self-end">
          <img
            src={appShowcase}
            alt="SokoLink app: home screen and the Groceries list"
            width={1000}
            height={835}
            loading="lazy"
            className="w-full max-w-md rounded-3xl drop-shadow-2xl transition duration-500 hover:-translate-y-1 md:max-w-lg"
          />
        </div>
      </div>
    </section>
  );
}
