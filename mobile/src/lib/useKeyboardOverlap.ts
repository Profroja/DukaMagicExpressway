import { useEffect, useRef, useState } from "react";
import { Keyboard, Platform, type View } from "react-native";

/**
 * How much of `ref`'s view the on-screen keyboard covers, in px.
 *
 * Measures the view's bottom edge against the keyboard's top edge, so it is
 * right whether or not the OS already resized the window (Android
 * edge-to-edge does not; older setups do) - no double padding either way.
 */
export function useKeyboardOverlap() {
  const ref = useRef<View>(null);
  const [overlap, setOverlap] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const show = Keyboard.addListener(showEvent, (e) => {
      const keyboardTop = e.endCoordinates.screenY;
      ref.current?.measureInWindow((_x, y, _w, height) => {
        setOverlap(Math.max(0, y + height - keyboardTop));
      });
    });
    const hide = Keyboard.addListener(hideEvent, () => setOverlap(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return { ref, overlap };
}
