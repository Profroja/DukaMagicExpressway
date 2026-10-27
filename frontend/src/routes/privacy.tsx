import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, Mail, MapPin, ShieldCheck } from "lucide-react";

import { BrandLogo } from "@/components/BrandLogo";
import { CONTACT_EMAIL } from "@/lib/contact";
import { useLanguage } from "@/lib/LanguageContext";
import { absolute, pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: pageMeta({
      title: "Privacy Policy | SokoLink",
      description:
        "How SokoLink collects, uses, shares and protects personal data for its shopping and delivery app and website.",
      path: "/privacy",
    }),
    links: [{ rel: "canonical", href: absolute("/privacy") }],
  }),
  component: PrivacyPage,
});

type Block = string | string[];
type Section = { id: string; title: string; blocks: Block[] };
type Copy = {
  home: string;
  title: string;
  subtitle: string;
  effective: string;
  lastUpdated: string;
  sections: Section[];
  contactTitle: string;
  contactBody: string;
};

const CONTENT: Record<"en" | "sw", Copy> = {
  en: {
    home: "Home",
    title: "Privacy Policy",
    subtitle:
      "How SokoLink collects, uses, shares and protects personal data when you use our website and mobile app.",
    effective: "Effective: 27 October 2026",
    lastUpdated: "Last updated: 27 October 2026",
    sections: [
      {
        id: "who-we-are",
        title: "1. Who we are",
        blocks: [
          'SokoLink ("SokoLink", "we", "us" or "our") provides an online marketplace and delivery service in Tanzania through https://sokolink.co.tz and the SokoLink mobile application (package name com.sokolink.app).',
          "SokoLink is the controller of the personal data processed through the app and website. We are based in Dar es Salaam, Tanzania, and you can contact us at " +
            CONTACT_EMAIL +
            ".",
          "This Privacy Policy applies to customers, vendors, delivery staff, and visitors to our website and app. By using SokoLink, you acknowledge the practices described in this policy.",
        ],
      },
      {
        id: "information-we-collect",
        title: "2. Information we collect",
        blocks: [
          "We collect only the information we need to run the marketplace and deliver orders.",
          [
            "Contact details: your name, phone number, and (for vendors and staff) email address and account password, which is stored in hashed form.",
            "Order details: the products or services you order, quantities, prices, order notes, delivery address, the location you share, the recipient's name and phone number, and your order status and history.",
            "Payment details: the payment method you select, the transaction reference or ID you provide, the amount, and confirmation of payment. We do not collect or store mobile money PINs, card numbers, or bank credentials.",
            "Vendor and staff details: business name, store information, email, phone number, role, and activity within the platform.",
            "Support communications: messages, emails, or call notes you send to us.",
            "Device and technical data: app version, device type and operating system, IP address, server logs, notification permission status, language preference, and data stored on your device such as your cart, saved orders, and settings.",
            "Location data: your precise or approximate location when you allow the permission, used to calculate delivery fees, deliver your order, and send your order to the SokoLink team in your city. You can type an address instead of sharing GPS location.",
          ],
          "We do not intentionally collect sensitive personal data such as health information, religious beliefs, or biometric data, and we do not knowingly collect data from children.",
        ],
      },
      {
        id: "how-we-use",
        title: "3. How we use your information",
        blocks: [
          "We use personal data to:",
          [
            "Create, confirm, prepare, and deliver your orders, and calculate delivery fees.",
            "Communicate with you about your order and provide customer support.",
            "Process and reconcile payments.",
            "Manage vendor and staff accounts and measure service performance.",
            "Send you notifications about the status of your orders.",
            "Prevent fraud, misuse, and security incidents, and verify identity where needed.",
            "Improve the app and website, troubleshoot problems, and produce aggregated statistics.",
            "Comply with legal obligations and protect our legal rights.",
          ],
          "We do not sell your personal data. We do not use your personal data for third-party advertising.",
        ],
      },
      {
        id: "location-and-permissions",
        title: "4. Location and device permissions",
        blocks: [
          "The app may ask for permission to use your location so we can calculate the delivery fee and deliver your order. This permission is optional. You can refuse it or turn it off in your device settings, but some features may then require you to enter an address manually.",
          "The app may periodically check the status of your active orders in the background so it can notify you when the status changes. It does not collect your location in the background.",
          "The app may ask for permission to send notifications. You can disable notifications in your device settings.",
        ],
      },
      {
        id: "cookies-and-storage",
        title: "5. Cookies and device storage",
        blocks: [
          "Our website may use cookies and browser storage to remember your language, keep your cart, and maintain secure sessions for vendors and staff.",
          "The mobile app stores information on your device, such as your language, cart, saved orders, and settings. This information stays on your device unless it is needed to process an order.",
          "We do not use cookies for third-party advertising. You can clear cookies and app data through your browser or device settings, but doing so may remove your saved cart or order history.",
        ],
      },
      {
        id: "sharing",
        title: "6. How we share information",
        blocks: [
          "We share personal data only as needed to provide the service:",
          [
            "Stores and vendors: SokoLink buys the items from the store on your behalf. The store receives only the item, quantity and price - never your name, phone number or address.",
            "Delivery staff and riders receive your name, phone number, delivery address, and order details so they can deliver to you.",
            "Payment providers and mobile money operators receive the information needed to confirm and reconcile your payment.",
            "Technology service providers support our hosting, database, email or SMS delivery, mapping and distance calculations (such as Google Maps), and app infrastructure. They process data on our behalf under contracts and only for the purposes we specify.",
            "Professional advisers, authorities, or other parties may receive data where required by law, to protect our rights, or as part of a sale or merger of the business.",
          ],
          "We do not sell or rent your personal data, and we do not share it with advertising networks.",
        ],
      },
      {
        id: "payments",
        title: "7. Payments",
        blocks: [
          "Payments are made through mobile money to the numbers shown in the app, and you send us the transaction reference so we can confirm your payment. We do not control mobile money providers; their own privacy policies apply to their services.",
          "We will never ask for your mobile money PIN, card number, or bank password.",
        ],
      },
      {
        id: "retention",
        title: "8. How long we keep information",
        blocks: [
          [
            "Account data is kept while your account is active and for a reasonable period after it is closed.",
            "Order and payment records are kept for as long as needed for accounting, tax, dispute resolution, and legal obligations.",
            "Location and order details are kept only as long as needed to complete the order and provide related support.",
            "Support messages are kept for as long as needed to resolve your issue.",
          ],
          "When we no longer need personal data, we delete it or anonymise it, unless the law requires us to keep it.",
        ],
      },
      {
        id: "security",
        title: "9. How we protect information",
        blocks: [
          "We use HTTPS, access controls, hashed passwords, and the principle of least privilege to protect personal data. No method of transmission or storage is completely secure, so please protect your phone and PIN and contact us immediately if you notice suspicious activity.",
        ],
      },
      {
        id: "your-rights",
        title: "10. Your rights",
        blocks: [
          "Under the Personal Data Protection Act, 2022 of Tanzania and other applicable laws, you may have the right to:",
          [
            "Request a copy of the personal data we hold about you.",
            "Correct personal data that is inaccurate or incomplete.",
            "Request deletion of your personal data.",
            "Object to or request restriction of certain processing.",
            "Withdraw consent where processing is based on consent.",
            "Request your data in a portable format where applicable.",
            "Complain to the Personal Data Protection Commission of Tanzania.",
          ],
          "To exercise these rights, contact us at " +
            CONTACT_EMAIL +
            ". We may need to verify your identity before responding, and we will respond within 30 days. Some data may be retained where the law requires it.",
          "To request deletion of your account and associated data, email us from the phone number or email address registered to your account.",
        ],
      },
      {
        id: "children",
        title: "11. Children",
        blocks: [
          "SokoLink is not intended for children under 18. We do not knowingly collect personal data from children. If you believe a child has provided personal data to us, please contact us and we will delete it.",
        ],
      },
      {
        id: "international-transfers",
        title: "12. International transfers",
        blocks: [
          "Personal data may be stored or processed outside Tanzania by our service providers, for example cloud hosting or mapping providers. We take steps to protect personal data through contracts and appropriate safeguards consistent with applicable law.",
        ],
      },
      {
        id: "third-party-links",
        title: "13. Third-party links and services",
        blocks: [
          "The app or website may link to third-party sites or services, such as social media or mobile money providers. This Privacy Policy does not apply to those third parties. Please review their privacy policies before using them.",
        ],
      },
      {
        id: "changes",
        title: "14. Changes to this policy",
        blocks: [
          "We may update this Privacy Policy from time to time. The updated version will be posted on this page with a new effective date. If we make material changes, we will notify you through the app or website. Continued use of SokoLink after an update means you accept the updated policy.",
        ],
      },
      {
        id: "contact",
        title: "15. Contact us",
        blocks: [
          "If you have questions, requests, or concerns about this Privacy Policy or how we handle your personal data, please contact us:",
        ],
      },
    ],
    contactTitle: "Data protection contact",
    contactBody:
      "SokoLink, Dar es Salaam, Tanzania. Email us at " +
      CONTACT_EMAIL +
      " and we will respond as soon as possible.",
  },
  sw: {
    home: "Nyumbani",
    title: "Sera ya Faragha",
    subtitle:
      "Jinsi SokoLink inavyokusanya, kutumia, kushiriki na kulinda taarifa binafsi unapotumia tovuti na programu yetu ya simu.",
    effective: "Ilianza kutumika: 27 Oktoba 2026",
    lastUpdated: "Ilisasishwa mwisho: 27 Oktoba 2026",
    sections: [
      {
        id: "who-we-are",
        title: "1. Sisi ni nani",
        blocks: [
          'SokoLink ("SokoLink", "sisi" au "yetu") inatoa soko la mtandaoni na huduma ya uletaji Tanzania kupitia https://sokolink.co.tz na programu ya simu ya SokoLink (package com.sokolink.app).',
          "SokoLink ndiye msimamizi wa taarifa binafsi zinazochakatwa kupitia programu na tovuti. Tuko Dar es Salaam, Tanzania, na unaweza kuwasiliana nasi kwa " +
            CONTACT_EMAIL +
            ".",
          "Sera hii ya Faragha inahusu wateja, wauzaji, wafanyakazi wa uletaji, na wageni wa tovuti na programu yetu. Kwa kutumia SokoLink, unakubali maelezo yaliyo katika sera hii.",
        ],
      },
      {
        id: "information-we-collect",
        title: "2. Taarifa tunazokusanya",
        blocks: [
          "Tunakusanya taarifa zinazohitajika tu ili kuendesha soko na kuleta oda.",
          [
            "Taarifa za mawasiliano: jina lako, namba ya simu, na (kwa wauzaji na wafanyakazi) barua pepe na nenosiri la akaunti, ambalo huhifadhiwa kwa usimbaji fiche.",
            "Taarifa za oda: bidhaa au huduma ulizoagiza, idadi, bei, maelezo ya oda, anwani ya kuletewa, mahali uliposhiriki, jina na namba ya simu ya mpokeaji, na hali na historia ya oda yako.",
            "Taarifa za malipo: njia ya malipo uliyochagua, namba ya muamala au rejeleo ulilotoa, kiasi, na uthibitisho wa malipo. Hatukusanyi wala kuhifadhi PIN ya pesa za simu, namba ya kadi, au siri za benki.",
            "Taarifa za wauzaji na wafanyakazi: jina la biashara, taarifa za duka, barua pepe, namba ya simu, jukumu, na shughuli ndani ya mfumo.",
            "Mawasiliano ya msaada: ujumbe, barua pepe, au maelezo ya simu unazotutumia.",
            "Taarifa za kifaa na kiufundi: toleo la programu, aina ya kifaa na mfumo wake, anwani ya IP, kumbukumbu za seva, hali ya ruhusa ya arifa, lugha unayopendelea, na data iliyohifadhiwa kwenye kifaa chako kama kikapu, oda zilizohifadhiwa, na mipangilio.",
            "Taarifa za mahali: mahali pako halisi au takriban unaporuhusu, kwa ajili ya kuhesabu gharama ya usafiri, kukuletea oda, na kupeleka oda yako kwa timu ya SokoLink ya mji wako. Unaweza kuandika anwani badala ya kushiriki mahali pa GPS.",
          ],
          "Hatukusanyi kwa makusudi taarifa nyeti kama taarifa za afya, imani ya dini, au alama za kibaiolojia, na hatukusanyi kwa makusudi taarifa za watoto.",
        ],
      },
      {
        id: "how-we-use",
        title: "3. Jinsi tunavyotumia taarifa zako",
        blocks: [
          "Tunatumia taarifa binafsi kwa:",
          [
            "Kutengeneza, kuthibitisha, kuandaa, na kuleta oda yako, na kuhesabu gharama za usafiri.",
            "Kuwasiliana nawe kuhusu oda yako na kutoa msaada kwa wateja.",
            "Kuchakata na kuoanisha malipo.",
            "Kusimamia akaunti za wauzaji na wafanyakazi na kupima utendaji wa huduma.",
            "Kukutumia arifa kuhusu hali ya oda yako.",
            "Kuzuia udanganyifu, matumizi mabaya, na masuala ya usalama, na kuthibitisha utambulisho inapohitajika.",
            "Kuboresha programu na tovuti, kutatua matatizo, na kuandaa takwimu zilizojumuishwa.",
            "Kutimiza wajibu wa kisheria na kulinda haki zetu za kisheria.",
          ],
          "Hatuuzi taarifa zako binafsi. Hatuutumii taarifa zako binafsi kwa matangazo ya watu wengine.",
        ],
      },
      {
        id: "location-and-permissions",
        title: "4. Mahali na ruhusa za kifaa",
        blocks: [
          "Programu inaweza kuomba ruhusa ya kutumia mahali ulipo ili tuhesabu gharama ya usafiri na kukuletea oda. Ruhusa hii ni ya hiari. Unaweza kuikataa au kuizima kwenye mipangilio ya kifaa chako, lakini baadhi ya huduma zinaweza kuhitaji uandike anwani kwa mkono.",
          "Programu inaweza kuangalia hali ya oda zako zinazoendelea mara kwa mara chinichini ili ikujulishe hali inapobadilika. Haikusanyi mahali ulipo chinichini.",
          "Programu inaweza kuomba ruhusa ya kutuma arifa. Unaweza kuzima arifa kwenye mipangilio ya kifaa chako.",
        ],
      },
      {
        id: "cookies-and-storage",
        title: "5. Vidakuzi na hifadhi kwenye kifaa",
        blocks: [
          "Tovuti yetu inaweza kutumia vidakuzi na hifadhi ya kivinjari ili kukumbuka lugha yako, kuhifadhi kikapu chako, na kudumisha vikao salama vya wauzaji na wafanyakazi.",
          "Programu ya simu huhifadhi taarifa kwenye kifaa chako, kama lugha yako, kikapu, oda zilizohifadhiwa, na mipangilio. Taarifa hizi hubaki kwenye kifaa chako isipokuwa zinahitajika kuchakata oda.",
          "Hatumii vidakuzi kwa matangazo ya watu wengine. Unaweza kufuta vidakuzi na data ya programu kupitia kivinjari au mipangilio ya kifaa chako, lakini kufanya hivyo kunaweza kuondoa kikapu au historia ya oda zilizohifadhiwa.",
        ],
      },
      {
        id: "sharing",
        title: "6. Jinsi tunavyoshiriki taarifa",
        blocks: [
          "Tunashiriki taarifa binafsi pale tu inapohitajika kutoa huduma:",
          [
            "Maduka na wauzaji: SokoLink hununua bidhaa dukani kwa niaba yako. Duka hupokea bidhaa, idadi na bei tu - kamwe si jina lako, namba ya simu wala anwani yako.",
            "Wafanyakazi wa uletaji na madereva hupokea jina lako, namba ya simu, anwani ya kuletewa, na maelezo ya oda ili wakuletee.",
            "Watoa huduma za malipo na mitandao ya pesa za simu hupokea taarifa zinazohitajika kuthibitisha na kuoanisha malipo yako.",
            "Watoa huduma wa teknolojia wanasaidia seva, hifadhidata, utumaji wa barua pepe au SMS, ramani na hesabu za umbali (kama Google Maps), na miundombinu ya programu. Wanachakata data kwa niaba yetu chini ya mikataba na kwa madhumuni tunayoeleza tu.",
            "Washauri wa kitaalamu, mamlaka, au wahusika wengine wanaweza kupokea data inapohitajika kisheria, kulinda haki zetu, au kama sehemu ya kuuza au kuunganisha biashara.",
          ],
          "Hatuuzi au kukodisha taarifa zako binafsi, na hatuzishiriki na mitandao ya matangazo.",
        ],
      },
      {
        id: "payments",
        title: "7. Malipo",
        blocks: [
          "Malipo hufanywa kwa pesa za simu kwenda namba zinazoonyeshwa kwenye programu, na unatutumia namba ya muamala ili tuweze kuthibitisha malipo yako. Hatudhibiti watoa huduma za pesa za simu; sera zao za faragha zinatumika kwa huduma zao.",
          "Hatutakuomba kamwe PIN yako ya pesa za simu, namba ya kadi, au nenosiri la benki.",
        ],
      },
      {
        id: "retention",
        title: "8. Muda tunaohifadhi taarifa",
        blocks: [
          [
            "Taarifa za akaunti huhifadhiwa wakati akaunti yako iko hai na kwa muda unaofaa baada ya kufungwa.",
            "Kumbukumbu za oda na malipo huhifadhiwa kwa muda unaohitajika kwa uhasibu, kodi, utatuzi wa migogoro, na wajibu wa kisheria.",
            "Taarifa za mahali na oda huhifadhiwa kwa muda unaohitajika kukamilisha oda na kutoa msaada unaohusiana.",
            "Ujumbe wa msaada huhifadhiwa kwa muda unaohitajika kutatua suala lako.",
          ],
          "Tunapokuwa hatuhitaji tena taarifa binafsi, tunazifuta au kuzificha, isipokuwa sheria inatuhitaji kuzihifadhi.",
        ],
      },
      {
        id: "security",
        title: "9. Jinsi tunavyolinda taarifa",
        blocks: [
          "Tunatumia HTTPS, udhibiti wa ufikiaji, nenosiri lililosimbwa kwa fiche, na kanuni ya upendeleo mdogo kulinda taarifa binafsi. Hakuna njia ya usambazaji au uhifadhi iliyo salama kwa asilimia 100, kwa hiyo tafadhali linda simu yako na PIN yako na wasiliana nasi mara moja ukiona shughuli ya kutiliwa shaka.",
        ],
      },
      {
        id: "your-rights",
        title: "10. Haki zako",
        blocks: [
          "Chini ya Sheria ya Ulinzi wa Taarifa Binafsi ya 2022 ya Tanzania na sheria nyingine zinazotumika, unaweza kuwa na haki ya:",
          [
            "Kuomba nakala ya taarifa binafsi tulizonazo kukuhusu.",
            "Kusahihisha taarifa binafsi zisizo sahihi au zisizokamilika.",
            "Kuomba kufutwa kwa taarifa zako binafsi.",
            "Kupinga au kuomba kikomo cha uchakataji fulani.",
            "Kuondoa ridhaa pale uchakataji unategemea ridhaa.",
            "Kuomba taarifa zako katika muundo unaoweza kuhamishwa inapohitajika.",
            "Kuwasilisha malalamiko kwa Tume ya Ulinzi wa Taarifa Binafsi ya Tanzania.",
          ],
          "Ili kutumia haki hizi, wasiliana nasi kwa " +
            CONTACT_EMAIL +
            ". Tunaweza kuhitaji kuthibitisha utambulisho wako kabla ya kujibu, na tutajibu ndani ya siku 30. Baadhi ya data inaweza kuhifadhiwa pale sheria inapohitaji.",
          "Ili kuomba kufutwa kwa akaunti yako na data inayohusiana, tutumie barua pepe kutoka namba ya simu au barua pepe iliyosajiliwa kwenye akaunti yako.",
        ],
      },
      {
        id: "children",
        title: "11. Watoto",
        blocks: [
          "SokoLink haikusudiwi watoto chini ya miaka 18. Hatukusanyi kwa makusudi taarifa binafsi za watoto. Ukiamini mtoto ametupa taarifa binafsi, tafadhali wasiliana nasi na tutazifuta.",
        ],
      },
      {
        id: "international-transfers",
        title: "12. Uhamishaji wa taarifa nje ya Tanzania",
        blocks: [
          "Taarifa binafsi zinaweza kuhifadhiwa au kuchakatwa nje ya Tanzania na watoa huduma wetu, kwa mfano seva za wingu au watoa huduma za ramani. Tunachukua hatua za kulinda taarifa binafsi kupitia mikataba na ulinzi unaofaa unaolingana na sheria zinazotumika.",
        ],
      },
      {
        id: "third-party-links",
        title: "13. Viungo na huduma za watu wengine",
        blocks: [
          "Programu au tovuti inaweza kuwa na viungo vya tovuti au huduma za watu wengine, kama mitandao ya kijamii au watoa huduma za pesa za simu. Sera hii ya Faragha haihusu wahusika hao. Tafadhali soma sera zao za faragha kabla ya kuzitumia.",
        ],
      },
      {
        id: "changes",
        title: "14. Mabadiliko ya sera hii",
        blocks: [
          "Tunaweza kusasisha Sera hii ya Faragha mara kwa mara. Toleo lililosasishwa litawekwa kwenye ukurasa huu na tarehe mpya ya kuanza kutumika. Tukifanya mabadiliko makubwa, tutakujulisha kupitia programu au tovuti. Kuendelea kutumia SokoLink baada ya sasisho kunamaanisha unakubali sera iliyosasishwa.",
        ],
      },
      {
        id: "contact",
        title: "15. Wasiliana nasi",
        blocks: [
          "Ukiwa na maswali, maombi, au wasiwasi kuhusu Sera hii ya Faragha au jinsi tunavyoshughulikia taarifa zako binafsi, tafadhali wasiliana nasi:",
        ],
      },
    ],
    contactTitle: "Mawasiliano ya ulinzi wa data",
    contactBody:
      "SokoLink, Dar es Salaam, Tanzania. Tutumie barua pepe kwa " +
      CONTACT_EMAIL +
      " na tutajibu haraka iwezekanavyo.",
  },
};

function PrivacyPage() {
  const { lang, setLang } = useLanguage();
  const copy = CONTENT[lang];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 lg:px-7">
          <Link to="/" className="flex items-center gap-2">
            <BrandLogo className="size-9 rounded-xl" />
            <strong className="text-lg leading-none text-navy">
              Soko<em className="not-italic text-primary">Link</em>
            </strong>
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex overflow-hidden rounded-lg border border-border text-xs font-black">
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`px-3 py-1.5 transition ${
                  lang === "en"
                    ? "bg-primary text-white"
                    : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
                aria-pressed={lang === "en"}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang("sw")}
                className={`px-3 py-1.5 transition ${
                  lang === "sw"
                    ? "bg-primary text-white"
                    : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
                aria-pressed={lang === "sw"}
              >
                SW
              </button>
            </div>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:border-primary hover:text-primary"
            >
              <ArrowLeft className="size-3.5" />
              <span className="hidden sm:inline">{copy.home}</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 lg:px-7">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-navy via-slate-900 to-orange-900 p-6 text-white shadow-xl sm:p-9">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/90 ring-1 ring-white/20">
            <ShieldCheck className="size-4 text-primary" /> SokoLink
          </span>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">{copy.title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base">
            {copy.subtitle}
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-bold">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/15">
              <CalendarDays className="size-3.5 text-primary" /> {copy.effective}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/15">
              {copy.lastUpdated}
            </span>
          </div>
        </div>

        <div className="mt-8 space-y-8">
          {copy.sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <h2 className="text-lg font-black text-navy sm:text-xl">{section.title}</h2>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-600 sm:text-[15px]">
                {section.blocks.map((block, index) =>
                  Array.isArray(block) ? (
                    <ul key={index} className="list-disc space-y-2 pl-5 marker:text-primary">
                      {block.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p key={index}>{block}</p>
                  ),
                )}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-primary/20 bg-orange-50 p-6">
          <h2 className="flex items-center gap-2 text-base font-black text-navy">
            <Mail className="size-5 text-primary" /> {copy.contactTitle}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">{copy.contactBody}</p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm font-bold">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white transition hover:bg-orange-600"
            >
              <Mail className="size-4" /> {CONTACT_EMAIL}
            </a>
            <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-600">
              <MapPin className="size-4 text-primary" /> Dar es Salaam, Tanzania
            </span>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-slate-400">
          <Link to="/" className="font-bold text-primary hover:underline">
            SokoLink
          </Link>{" "}
          &middot; https://sokolink.co.tz
        </p>
      </main>
    </div>
  );
}
