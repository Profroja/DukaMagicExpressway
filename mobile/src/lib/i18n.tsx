import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Language = "en" | "sw";

const en = {
  appName: "SokoLink",
  tagline: "Goods & Services",
  splashTagline: "Products and services at your fingertips",
  // tabs
  tabHome: "Home",
  tabServices: "Services",
  tabCart: "Cart",
  tabOrders: "My Orders",
  // home
  searchPlaceholder: "Search products & services",
  // Hero slides (match the pictures)
  heroRiderTitle: "Anything You Need",
  heroRiderAccent: "Delivered by SokoLink",
  heroShopTitle: "Shop Everything",
  heroShopAccent: "Phones, Fashion & Gifts",
  heroGroceriesTitle: "Fresh Groceries",
  heroGroceriesAccent: "Delivered to Your Door",
  heroFoodTitle: "Hungry? Order Food",
  heroFoodAccent: "Hot Meals, Delivered Fast",
  heroChipAffordable: "Affordable",
  heroChipFast: "Fast delivery",
  heroChipAnyTime: "Any time",
  categories: "Categories",
  popularProducts: "Popular Products",
  ourServices: "Our Services",
  seeAll: "See all",
  noProducts: "No products available yet.",
  noServices: "No services available yet.",
  nothingHere: "Nothing here yet.",
  // categories
  electronics: "Electronics",
  fashion: "Fashion",
  homeLiving: "Home & Living",
  beautyHealth: "Beauty & Health",
  groceries: "Groceries",
  automotive: "Automotive",
  sportsOutdoors: "Sports & Outdoors",
  booksStationery: "Books & Stationery",
  services: "Services",
  // prices
  priceFrom: "From",
  priceOnRequest: "Price on request",
  servicePriceNote: "Starting price — the final price depends on the job.",
  // product / order
  orderNow: "Order Now",
  bookNow: "Book Now",
  addToCart: "Add to Cart",
  addedToCart: "Added to cart",
  quantity: "Quantity",
  total: "Total",
  completeOrder: "Complete Your Order",
  completeBooking: "Complete Your Booking",
  contactHint: "Enter your name and phone — SokoLink will call you and deliver.",
  yourName: "Your Name",
  namePlaceholder: "e.g. Amina Juma",
  mobileNumber: "Mobile Number",
  phonePlaceholder: "e.g. 0712 345 678",
  deliveryLocation: "Delivery Location",
  serviceLocation: "Where should we come?",
  locationPlaceholder: "Directions: street, building, landmark...",
  shareLocation: "Share my location",
  updateLocation: "Update location",
  locating: "Finding your location...",
  locationShared: "Location shared",
  locationDenied: "Allow location access so we can deliver to you.",
  locationFailed: "Could not get your location. Turn on GPS and try again.",
  errLocation: "Please share your delivery location.",
  items: "Items",
  deliveryFee: "Delivery fee",
  free: "Free",
  pickLocation: "Share location",
  weConfirm: "We'll confirm",
  outOfRange: "Out of range",
  outOfRangeNote: "We deliver up to {max} km. You are {km} km away.",
  inclDelivery: "incl. delivery {fee}",
  // Staff mode
  staffLogin: "Staff sign in",
  staffLoginHint: "For SokoLink staff only. Sign in to get alerts for new orders in your city.",
  phoneOrEmail: "Phone number or email",
  password: "Password",
  signIn: "Sign in",
  signingIn: "Signing in...",
  errLogin: "Enter your phone number or email and password.",
  staffOrders: "Orders",
  staffAllCities: "All cities",
  logout: "Sign out",
  logoutConfirm: "Sign out of staff mode?",
  filterNew: "New",
  filterActive: "In progress",
  filterAll: "All",
  noStaffOrders: "No orders here yet.",
  callCustomer: "Call customer",
  openMap: "Open location",
  processOnWeb: "Process on the website",
  processHint: "Call the customer to confirm, then update the order on the SokoLink website.",
  customer: "Customer",
  orderDetails: "Order",
  sessionExpired: "Please sign in again.",
  staffStatusNew: "New",
  staffStatusContacted: "Contacted",
  staffStatusConfirmed: "Confirmed",
  staffStatusSourcing: "At the store",
  staffStatusPickedUp: "On the way",
  staffStatusDelivered: "Delivered",
  staffStatusClosed: "Closed",
  staffStatusCancelled: "Cancelled",
  allCategories: "All categories",
  searchCategories: "Search categories...",
  goods: "Goods",
  noCategoryMatch: "No category matches your search.",
  continue: "Continue",
  whereDeliver: "Where should we deliver?",
  whereCome: "Where should we come?",
  locationHint: "Share your location so we can find you. Add directions to help the rider.",
  mapUnavailable: "Map preview unavailable",
  confirmOrder: "Confirm Order",
  confirmBooking: "Confirm Booking",
  submitting: "Submitting...",
  errName: "Please enter your name.",
  errPhone: "Please enter a valid mobile number.",
  errNetwork: "Can't reach SokoLink. Check your connection and try again.",
  deliveredBy: "Delivered by SokoLink",
  // tracking
  orderReceived: "Order Received!",
  confirmingOrder: "Confirming Your Order",
  preparingOrder: "Preparing Your Order",
  onTheWay: "On the Way!",
  deliveredTitle: "Delivered! 🎉",
  cancelledTitle: "Order Cancelled",
  willCall: "SokoLink will call {phone} to confirm",
  gettingReady: "We are getting your items ready",
  bringingOrder: "SokoLink is bringing your order to you",
  thanks: "Thank you for shopping with SokoLink.",
  noLongerProcessed: "This order is no longer being processed.",
  stepReceived: "Received",
  stepConfirmed: "Confirmed",
  stepPreparing: "Preparing",
  stepOnTheWay: "On the way",
  cancelOrder: "Cancel Order",
  cancelConfirm: "Cancel this order?",
  yesCancel: "Yes, cancel",
  keepOrder: "Keep it",
  done: "Done",
  trackInOrders: "Close — track in My Orders",
  // statuses
  statusNew: "Order received",
  statusContacted: "We are contacting you",
  statusConfirmed: "Confirmed",
  statusSourcing: "Preparing your order",
  statusPickedUp: "On the way",
  statusDelivered: "Delivered",
  statusCancelled: "Cancelled",
  // orders
  myOrders: "My Orders",
  ordersSubtitle: "Ongoing and completed orders on this phone",
  noOrders: "No orders yet",
  noOrdersHint: "Your orders will be saved here after you place them.",
  startShopping: "Start shopping",
  ongoing: "Ongoing",
  completed: "Completed",
  // cart
  cart: "Cart",
  cartEmpty: "Your cart is empty",
  cartEmptyHint: "Save products here and order them when you're ready.",
  order: "Order",
  remove: "Remove",
  // misc
  back: "Back",
  retry: "Try again",
  loading: "Loading...",
  language: "Lugha: Kiswahili",
  offline: "Can't reach the server",
};

type Key = keyof typeof en;

const sw: Record<Key, string> = {
  appName: "SokoLink",
  tagline: "Bidhaa na Huduma",
  splashTagline: "Bidhaa na huduma mkononi mwako",
  tabHome: "Nyumbani",
  tabServices: "Huduma",
  tabCart: "Kikapu",
  tabOrders: "Maagizo",
  searchPlaceholder: "Tafuta bidhaa na huduma",
  // Hero slides
  heroRiderTitle: "Chochote Unachohitaji",
  heroRiderAccent: "Kinaletwa na SokoLink",
  heroShopTitle: "Nunua Kila Kitu",
  heroShopAccent: "Simu, Mavazi na Zawadi",
  heroGroceriesTitle: "Mahitaji ya Nyumbani",
  heroGroceriesAccent: "Tunakuletea Mlangoni",
  heroFoodTitle: "Una Njaa? Agiza Chakula",
  heroFoodAccent: "Chakula cha Moto, Tunakuletea Haraka",
  heroChipAffordable: "Bei nafuu",
  heroChipFast: "Uletewaji wa haraka",
  heroChipAnyTime: "Wakati wowote",
  categories: "Makundi",
  popularProducts: "Bidhaa Maarufu",
  ourServices: "Huduma Zetu",
  seeAll: "Ona zote",
  noProducts: "Hakuna bidhaa bado.",
  noServices: "Hakuna huduma bado.",
  nothingHere: "Hakuna kitu hapa bado.",
  electronics: "Elektroniki",
  fashion: "Mitindo",
  homeLiving: "Nyumba na Maisha",
  beautyHealth: "Urembo na Afya",
  groceries: "Mahitaji ya Nyumbani",
  automotive: "Magari",
  sportsOutdoors: "Michezo",
  booksStationery: "Vitabu na Vifaa",
  services: "Huduma",
  priceFrom: "Kuanzia",
  priceOnRequest: "Bei kwa makubaliano",
  servicePriceNote: "Bei ya kuanzia — bei kamili inategemea ukubwa wa kazi.",
  orderNow: "Agiza Sasa",
  bookNow: "Weka Sasa",
  addToCart: "Weka Kikapuni",
  addedToCart: "Imewekwa kikapuni",
  quantity: "Idadi",
  total: "Jumla",
  completeOrder: "Maliza Agizo Lako",
  completeBooking: "Maliza Uhifadhi Wako",
  contactHint: "Weka jina na namba yako ya simu — SokoLink itakupigia na kukuletea.",
  yourName: "Jina Lako",
  namePlaceholder: "Mfano: Amina Juma",
  mobileNumber: "Namba ya Simu",
  phonePlaceholder: "Mfano: 0712 345 678",
  deliveryLocation: "Mahali pa Kuletewa",
  serviceLocation: "Huduma itafanyika wapi?",
  locationPlaceholder: "Maelezo: mtaa, jengo, alama...",
  shareLocation: "Tuma mahali nilipo",
  updateLocation: "Badilisha mahali",
  locating: "Tunatafuta mahali ulipo...",
  locationShared: "Mahali pametumwa",
  locationDenied: "Ruhusu ufikiaji wa mahali ili tukuletee.",
  locationFailed: "Imeshindwa kupata mahali ulipo. Washa GPS ujaribu tena.",
  errLocation: "Tafadhali tuma mahali pa kuletewa.",
  items: "Bidhaa",
  deliveryFee: "Gharama ya usafiri",
  free: "Bure",
  pickLocation: "Tuma mahali",
  weConfirm: "Tutakujulisha",
  outOfRange: "Nje ya eneo",
  outOfRangeNote: "Tunaleta hadi km {max}. Uko km {km}.",
  inclDelivery: "pamoja na usafiri {fee}",
  staffLogin: "Ingia (Wafanyakazi)",
  staffLoginHint: "Kwa wafanyakazi wa SokoLink pekee. Ingia upate taarifa za oda mpya za mji wako.",
  phoneOrEmail: "Namba ya simu au barua pepe",
  password: "Nenosiri",
  signIn: "Ingia",
  signingIn: "Inaingia...",
  errLogin: "Weka namba ya simu au barua pepe na nenosiri.",
  staffOrders: "Oda",
  staffAllCities: "Miji yote",
  logout: "Toka",
  logoutConfirm: "Toka kwenye akaunti ya mfanyakazi?",
  filterNew: "Mpya",
  filterActive: "Zinaendelea",
  filterAll: "Zote",
  noStaffOrders: "Hakuna oda hapa bado.",
  callCustomer: "Mpigie mteja",
  openMap: "Fungua mahali",
  processOnWeb: "Shughulikia kwenye tovuti",
  processHint: "Mpigie mteja kuthibitisha, kisha sasisha oda kwenye tovuti ya SokoLink.",
  customer: "Mteja",
  orderDetails: "Oda",
  sessionExpired: "Tafadhali ingia tena.",
  staffStatusNew: "Mpya",
  staffStatusContacted: "Amepigiwa",
  staffStatusConfirmed: "Imethibitishwa",
  staffStatusSourcing: "Dukani",
  staffStatusPickedUp: "Njiani",
  staffStatusDelivered: "Imefika",
  staffStatusClosed: "Imefungwa",
  staffStatusCancelled: "Imeghairiwa",
  allCategories: "Makundi yote",
  searchCategories: "Tafuta makundi...",
  goods: "Bidhaa",
  noCategoryMatch: "Hakuna kundi linalolingana.",
  continue: "Endelea",
  whereDeliver: "Tukuletee Wapi?",
  whereCome: "Tukuje Wapi?",
  locationHint: "Tuma mahali ulipo ili tukupate. Ongeza maelezo kumsaidia msafirishaji.",
  mapUnavailable: "Ramani haipatikani",
  confirmOrder: "Thibitisha Agizo",
  confirmBooking: "Thibitisha Uhifadhi",
  submitting: "Inatuma...",
  errName: "Tafadhali weka jina lako.",
  errPhone: "Tafadhali weka namba sahihi ya simu.",
  errNetwork: "Imeshindwa kufikia SokoLink. Angalia mtandao na ujaribu tena.",
  deliveredBy: "Inaletwa na SokoLink",
  orderReceived: "Agizo Limepokelewa!",
  confirmingOrder: "Tunathibitisha Agizo",
  preparingOrder: "Tunaandaa Agizo Lako",
  onTheWay: "Agizo Liko Njiani!",
  deliveredTitle: "Limefika! 🎉",
  cancelledTitle: "Agizo Limeghairiwa",
  willCall: "SokoLink itakupigia {phone} kuthibitisha",
  gettingReady: "Tunakusanya bidhaa zako",
  bringingOrder: "SokoLink inakuletea agizo lako",
  thanks: "Asante kwa kununua na SokoLink.",
  noLongerProcessed: "Agizo hili halishughulikiwi tena.",
  stepReceived: "Limepokelewa",
  stepConfirmed: "Limethibitishwa",
  stepPreparing: "Linaandaliwa",
  stepOnTheWay: "Njiani",
  cancelOrder: "Ghairi Agizo",
  cancelConfirm: "Ghairi agizo hili?",
  yesCancel: "Ndiyo, ghairi",
  keepOrder: "Hapana",
  done: "Sawa, Asante!",
  trackInOrders: "Funga — fuatilia kwenye Maagizo",
  statusNew: "Agizo limepokelewa",
  statusContacted: "Tunawasiliana nawe",
  statusConfirmed: "Limethibitishwa",
  statusSourcing: "Tunaandaa agizo lako",
  statusPickedUp: "Liko njiani",
  statusDelivered: "Limefika",
  statusCancelled: "Limeghairiwa",
  myOrders: "Maagizo Yangu",
  ordersSubtitle: "Maagizo yanayoendelea na yaliyokamilika kwenye simu hii",
  noOrders: "Hakuna maagizo bado",
  noOrdersHint: "Maagizo yako yatahifadhiwa hapa baada ya kuyaweka.",
  startShopping: "Anza kununua",
  ongoing: "Yanayoendelea",
  completed: "Yaliyokamilika",
  cart: "Kikapu",
  cartEmpty: "Kikapu chako ni tupu",
  cartEmptyHint: "Hifadhi bidhaa hapa na uziagize ukiwa tayari.",
  order: "Agiza",
  remove: "Ondoa",
  back: "Rudi nyuma",
  retry: "Jaribu tena",
  loading: "Inapakia...",
  language: "Language: English",
  offline: "Imeshindwa kufikia seva",
};

const translations: Record<Language, Record<Key, string>> = { en, sw };
const STORAGE_KEY = "duka-language";

type LanguageContextValue = {
  language: Language;
  /** null while loading; false until the user picks a language the first time. */
  chosen: boolean | null;
  choose: (language: Language) => void;
  toggle: () => void;
  t: (key: Key, vars?: Record<string, string>) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");
  const [chosen, setChosen] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === "en" || saved === "sw") setLanguage(saved);
        setChosen(saved === "en" || saved === "sw");
      })
      .catch(() => setChosen(false));
  }, []);

  /** Set and save the language (asked once, on first launch). */
  const choose = (next: Language) => {
    setLanguage(next);
    setChosen(true);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  };

  const toggle = () => choose(language === "en" ? "sw" : "en");

  const t = (key: Key, vars?: Record<string, string>) => {
    let text = translations[language][key] ?? en[key];
    for (const [name, value] of Object.entries(vars ?? {})) text = text.replace(`{${name}}`, value);
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, chosen, choose, toggle, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used inside LanguageProvider");
  return value;
}

export type TranslationKey = Key;
