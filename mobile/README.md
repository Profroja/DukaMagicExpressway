# DukaHub — mobile app

The customer app (Android & iOS) for DukaHub, built with Expo / React Native.
It uses **the same API as the website** (`backend/`), so orders placed in the app appear on the
admin Orders page exactly like website orders.

## What customers can do

- Browse products and services, the 9 categories, and search
- Order products (quantity, name, phone, delivery location) and book services
- Follow each order live (received → confirmed → preparing → on the way → delivered), or cancel while it is new
- See all their orders in **My Orders**, saved on the phone like the website saves them in the browser
- Keep items in a **Cart** and order them later
- Switch between English and Swahili

## Run it on your phone (development)

1. Start the backend so other devices can reach it:

   ```bash
   cd backend
   .venv\Scripts\python manage.py runserver 0.0.0.0:8000
   ```

   In DEBUG mode Django automatically accepts this computer's Wi-Fi address and the Android
   emulator address (see `ALLOWED_HOSTS` in `backend/backend/settings.py`).

2. Start the app:

   ```bash
   cd mobile
   npx expo start
   ```

3. Install **Expo Go** on your phone, make sure the phone is on the **same Wi-Fi** as this
   computer, and scan the QR code. The app automatically talks to port 8000 on this computer.

If Windows Firewall asks, allow Python on private networks so the phone can reach port 8000.

## Point the app at a real server

Create `mobile/.env`:

```
EXPO_PUBLIC_API_URL=https://api.your-domain.co.tz
```

Restart `npx expo start` after changing it. (See `src/lib/api.ts`.)

## Build for the stores

Builds are made in the cloud with EAS — no Android Studio or Xcode needed:

```bash
npx eas-cli@latest build --platform android   # Play Store (.aab)
npx eas-cli@latest build --platform ios       # App Store (needs an Apple developer account)
```

Set `EXPO_PUBLIC_API_URL` to your live server before building a release.
App id: `com.dukamagic.expressway` (in `app.json`).

> The splash screen in Expo Go is a preview; Android shows the final splash only in a real build.

## Project layout

```
src/app/                 screens (Expo Router)
  (tabs)/index.tsx       Home - search, banner, categories, products, services
  (tabs)/services.tsx    All services
  (tabs)/cart.tsx        Cart
  (tabs)/orders.tsx      My Orders (live status)
  listing/[id].tsx       Product / service details + order form
  track/[id].tsx         Live order tracking
  category/[index].tsx   Category listing
  search.tsx             Search results
src/components/          SplashOverlay, cards, grid, header, shared UI
src/lib/api.ts           Backend API (same endpoints as the website)
src/lib/store.tsx        Cart + My Orders, saved on the device
src/lib/i18n.tsx         English / Swahili
```

## Checks

```bash
npx tsc --noEmit   # types
npx expo lint      # lint
npx expo-doctor    # dependency / config health
```

Install packages with `npx expo install <pkg>`. If npm 11 refuses with `EALLOWSCRIPTS`, install
the SDK-matching version from `node_modules/expo/bundledNativeModules.json` with `npm install`.
