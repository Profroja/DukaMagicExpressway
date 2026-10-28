/**
 * The Android app, offered as a direct APK download until it is live on
 * Google Play. The file lives on the server at backend/media/app/sokolink.apk
 * (served under /media like product images); replace it there for each new
 * build and update the version and size below.
 */
export const APK = {
  url: "/media/app/sokolink.apk",
  fileName: "SokoLink.apk",
  version: "1.0.0",
  sizeMb: 63,
};

/** True on Android phones and tablets (not inside our own app). */
export function isAndroid() {
  if (typeof navigator === "undefined") return false;
  return /android/i.test(navigator.userAgent);
}
