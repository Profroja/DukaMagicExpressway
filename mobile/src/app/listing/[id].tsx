import Ionicons from "@expo/vector-icons/Ionicons";
import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import * as Location from "expo-location";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, EmptyState, ErrorState, PriceText } from "@/components/ui";
import { Colors, Radius, Shadow } from "@/constants/theme";
import {
  API_URL,
  ApiError,
  fetchDeliveryQuote,
  fetchListing,
  fetchPaymentAccounts,
  getCachedListing,
  mediaUrl,
  placeOrder,
  type DeliveryQuote,
  type Listing,
  type PaymentAccount,
} from "@/lib/api";
import { formatMoney } from "@/lib/catalog";
import { useLanguage } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { useKeyboardOverlap } from "@/lib/useKeyboardOverlap";

/** Provider colours so customers recognise their mobile money service. */
const PROVIDER: Record<string, { bg: string; text: string; short: string }> = {
  mpesa: { bg: "#E60000", text: "#FFFFFF", short: "M-Pesa" },
  mixx: { bg: "#FFD200", text: "#0B2A6F", short: "Mixx" },
  airtel_money: { bg: "#ED1C24", text: "#FFFFFF", short: "Airtel" },
  halopesa: { bg: "#F58220", text: "#FFFFFF", short: "Halo" },
  azampesa: { bg: "#00A3E0", text: "#FFFFFF", short: "Azam" },
  ttcl_pesa: { bg: "#0066B3", text: "#FFFFFF", short: "T-Pesa" },
  bank: { bg: Colors.navy, text: "#FFFFFF", short: "Bank" },
  other: { bg: "#475569", text: "#FFFFFF", short: "Pay" },
};

export default function ListingScreen() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { id, qty, step: initialStep } = useLocalSearchParams<{
    id: string;
    qty?: string;
    step?: "contact";
  }>();
  const { addToCart, saveOrder, removeFromCart } = useStore();

  const [listing, setListing] = useState<Listing | undefined>(() => getCachedListing(id));
  const [loading, setLoading] = useState(!listing);
  const [failed, setFailed] = useState(false);
  const [quantity, setQuantity] = useState(Math.max(1, Number(qty) || 1));
  const [chosenStep, setStep] = useState<"details" | "contact" | "location" | "payment">(
    initialStep === "contact" ? "contact" : "details",
  );
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [quote, setQuote] = useState<DeliveryQuote | null>(null);
  const [mapFailed, setMapFailed] = useState(false);
  // Lipa numbers: customers pay first, then tap "Nimeshalipia" to send the order.
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [paidWith, setPaidWith] = useState<string | null>(null);
  const [reference, setReference] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  // Keep the form above the keyboard and the focused field in view.
  const { ref: rootRef, overlap: keyboardOverlap } = useKeyboardOverlap();
  const scrollRef = useRef<ScrollView>(null);
  const phoneRef = useRef<TextInput>(null);
  const addressRef = useRef<TextInput>(null);
  const revealField = () => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);

  const fetchIt = () =>
    fetchListing(id)
      .then((found) => {
        setListing(found);
        setFailed(false);
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));

  const retry = () => {
    setLoading(true);
    fetchIt();
  };

  // Opened from a link with nothing cached yet - fetch it.
  useEffect(() => {
    if (!getCachedListing(id)) fetchIt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    let alive = true;
    fetchPaymentAccounts()
      .then((list) => {
        if (!alive) return;
        setAccounts(list);
        setPaidWith((current) => current ?? list[0]?.id ?? null);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const isService = listing?.listing_type === "service";
  // Services skip quantity - straight to the booking form.
  const step = isService && chosenStep === "details" ? "contact" : chosenStep;

  if (loading) {
    return <ActivityIndicator color={Colors.primary} style={{ marginTop: 80 }} />;
  }
  if (failed) return <ErrorState onRetry={retry} />;
  if (!listing) return <EmptyState icon="alert-circle-outline" title={t("nothingHere")} />;

  const unitPrice = Number(listing.price) || 0;
  const total = unitPrice * quantity;
  const uri = mediaUrl(listing.image_url);
  // Goods are delivered from our main store; services happen at the customer's place.
  const deliveryFee = !isService && quote?.configured && quote.deliverable ? Number(quote.fee) || 0 : 0;
  const outOfRange = !isService && !!quote?.configured && !quote.deliverable;
  // Goods with a price are paid before the order is sent (when we have lipa numbers).
  const payFirst = !isService && total > 0 && accounts.length > 0;

  const copyNumber = (account: PaymentAccount) => {
    Clipboard.setStringAsync(account.number).catch(() => {});
    setCopied(account.id);
    setTimeout(() => setCopied((c) => (c === account.id ? null : c)), 1500);
  };

  const shareLocation = async () => {
    setLocationError("");
    setError("");
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationError(t("locationDenied"));
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const point = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      setCoords(point);
      setMapFailed(false);
      const [place] = await Location.reverseGeocodeAsync(point).catch(() => []);
      if (place && !address.trim()) {
        const label = [place.district || place.street || place.name, place.city || place.region]
          .filter(Boolean)
          .join(", ");
        if (label) setAddress(label.slice(0, 255));
      }
      if (!isService) setQuote(await fetchDeliveryQuote(point.latitude, point.longitude).catch(() => null));
    } catch {
      setLocationError(t("locationFailed"));
    } finally {
      setLocating(false);
    }
  };

  const contactError = () => {
    if (!name.trim()) return t("errName");
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 9 || digits.length > 15) return t("errPhone");
    return "";
  };

  // Details are fine: on to the location step, asking for the location right away.
  const goToLocation = () => {
    const problem = contactError();
    if (problem) return setError(problem);
    setError("");
    setStep("location");
    if (!coords) shareLocation();
  };

  const locationProblem = () => {
    if (!name.trim()) return t("errName");
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 9 || digits.length > 15) return t("errPhone");
    if (!isService && !coords) return t("errLocation");
    if (outOfRange)
      return t("outOfRangeNote", { max: String(Number(quote?.max_km)), km: String(Number(quote?.distance_km)) });
    return "";
  };

  // Location step: on to paying, or send the order straight away.
  const confirmLocation = () => {
    if (!payFirst) return submit();
    const problem = locationProblem();
    if (problem) return setError(problem);
    setError("");
    setStep("payment");
  };

  const submit = async () => {
    const problem = locationProblem();
    if (problem) return setError(problem);
    if (payFirst && !paidWith) return setError(t("errChoosePaidTo"));
    setError("");
    setSubmitting(true);
    try {
      const result = await placeOrder({
        listingId: listing.id,
        quantity: isService ? 1 : quantity,
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        latitude: coords?.latitude,
        longitude: coords?.longitude,
        payment: payFirst && paidWith ? { accountId: paidWith, reference: reference.trim() } : null,
      });
      saveOrder({
        id: result.order_id,
        listingId: listing.id,
        title: listing.title,
        imageUrl: listing.image_url,
        listingType: listing.listing_type,
        quantity: isService ? 1 : quantity,
        total: Number(result.grand_total) || total + deliveryFee,
        deliveryFee: Number(result.delivery_fee) || 0,
        currency: result.currency || listing.currency,
        phone: phone.trim(),
        status: "new",
        createdAt: new Date().toISOString(),
      });
      removeFromCart(listing.id);
      router.replace({ pathname: "/track/[id]", params: { id: result.order_id } });
    } catch (e) {
      setError(e instanceof ApiError && e.message !== "network" ? e.message : t("errNetwork"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View
      ref={rootRef}
      style={{ flex: 1, backgroundColor: Colors.background, paddingBottom: keyboardOverlap }}
    >
      <Stack.Screen
        options={{
          title: step !== "details" ? (isService ? t("completeBooking") : t("completeOrder")) : "",
        }}
      />
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {step === "details" ? (
          <>
            <View style={styles.hero}>
              {uri ? (
                <Image source={{ uri }} style={styles.heroImage} contentFit="contain" transition={200} />
              ) : (
                <Ionicons name="bag-handle-outline" size={64} color={Colors.textFaint} />
              )}
              {!!listing.sale && (
                <View style={styles.sale}>
                  <Text style={styles.saleText}>{listing.sale}</Text>
                </View>
              )}
            </View>

            <View style={styles.sheet}>
              {!!listing.store && (
                <View style={styles.store}>
                  <Ionicons name="storefront" size={13} color={Colors.primary} />
                  <Text style={styles.storeText}>{listing.store}</Text>
                </View>
              )}
              <Text style={styles.title}>{listing.title}</Text>
              {!!(listing.subcategory || listing.category) && (
                <Text style={styles.category}>{listing.subcategory || listing.category}</Text>
              )}

              <View style={styles.priceBox}>
                <Text style={styles.priceLabel}>{quantity > 1 ? t("total") : ""}</Text>
                <Text style={styles.priceBig}>{formatMoney(listing.currency, total)}</Text>
                {quantity > 1 && (
                  <Text style={styles.priceEach}>
                    {formatMoney(listing.currency, unitPrice)} × {quantity}
                  </Text>
                )}
                {!!listing.discount && (
                  <Text style={styles.priceOld}>
                    {formatMoney(listing.currency, Number(listing.discount) * quantity)}
                  </Text>
                )}
              </View>

              {!!listing.description && <Text style={styles.description}>{listing.description}</Text>}

              <Text style={styles.label}>{t("quantity")}</Text>
              <View style={styles.stepper}>
                <Pressable
                  onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  style={[styles.stepBtn, quantity <= 1 && { opacity: 0.4 }]}
                  accessibilityLabel="Decrease quantity"
                >
                  <Ionicons name="remove" size={20} color={Colors.navy} />
                </Pressable>
                <Text style={styles.stepValue}>{quantity}</Text>
                <Pressable
                  onPress={() => setQuantity((q) => Math.min(999, q + 1))}
                  style={styles.stepBtn}
                  accessibilityLabel="Increase quantity"
                >
                  <Ionicons name="add" size={20} color={Colors.navy} />
                </Pressable>
              </View>
            </View>
          </>
        ) : step === "location" ? (
          <View style={styles.form}>
            <Text style={styles.stepTitle}>{isService ? t("whereCome") : t("whereDeliver")}</Text>
            <Text style={styles.formHint}>{t("locationHint")}</Text>

            {/* Big map of the shared spot (served by our backend), or a big share button. */}
            <View style={styles.mapCard}>
              {coords && !mapFailed ? (
                <Image
                  source={{ uri: `${API_URL}/api/delivery/map/?lat=${coords.latitude.toFixed(6)}&lng=${coords.longitude.toFixed(6)}` }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  transition={250}
                  onError={() => setMapFailed(true)}
                />
              ) : (
                <View style={styles.mapEmpty}>
                  <Ionicons name={coords ? "location" : "navigate-circle"} size={56} color={Colors.primary} />
                  {coords ? (
                    <Text style={styles.mapEmptyText}>
                      {t("mapUnavailable")}
                      {"\n"}
                      {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
                    </Text>
                  ) : null}
                </View>
              )}
              {locating && (
                <View style={styles.mapBusy}>
                  <ActivityIndicator color="#FFFFFF" size="large" />
                  <Text style={styles.mapBusyText}>{t("locating")}</Text>
                </View>
              )}
              <Pressable
                onPress={shareLocation}
                disabled={locating}
                style={[styles.mapButton, coords && styles.mapButtonSecondary]}
                accessibilityRole="button"
              >
                <Ionicons name="navigate" size={16} color={coords ? Colors.primary : "#FFFFFF"} />
                <Text style={[styles.mapButtonText, coords && { color: Colors.primary }]}>
                  {coords ? t("updateLocation") : t("shareLocation")}
                </Text>
              </Pressable>
            </View>
            {coords && !locating && (
              <Text style={styles.locationMeta}>
                <Ionicons name="checkmark-circle" size={13} color={Colors.success} /> {t("locationShared")}
                {quote?.distance_km ? ` · ${Number(quote.distance_km)} km` : ""}
              </Text>
            )}
            {!!locationError && <Text style={styles.locationError}>{locationError}</Text>}

            <View style={[styles.inputWrap, { marginTop: 10 }]}>
              <Ionicons name="location-outline" size={18} color={Colors.textFaint} />
              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder={t("locationPlaceholder")}
                placeholderTextColor={Colors.textFaint}
                ref={addressRef}
                style={styles.input}
                maxLength={255}
                returnKeyType={payFirst ? "next" : "send"}
                onFocus={revealField}
                onSubmitEditing={confirmLocation}
              />
            </View>

            {!isService && (
              <View style={styles.totals}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>{t("items")}</Text>
                  <Text style={styles.totalValue}>{formatMoney(listing.currency, total)}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>{t("deliveryFee")}</Text>
                  <Text style={[styles.totalValue, outOfRange && { color: Colors.danger }]}>
                    {!coords
                      ? t("pickLocation")
                      : outOfRange
                        ? t("outOfRange")
                        : quote?.configured
                          ? deliveryFee > 0
                            ? formatMoney(listing.currency, deliveryFee)
                            : t("free")
                          : t("weConfirm")}
                  </Text>
                </View>
                <View style={[styles.totalRow, styles.grandRow]}>
                  <Text style={styles.grandLabel}>{t("total")}</Text>
                  <Text style={styles.grandValue}>{formatMoney(listing.currency, total + deliveryFee)}</Text>
                </View>
                {outOfRange && (
                  <Text style={styles.locationError}>
                    {t("outOfRangeNote", {
                      max: String(Number(quote?.max_km)),
                      km: String(Number(quote?.distance_km)),
                    })}
                  </Text>
                )}
              </View>
            )}

            {!!error && (
              <View style={styles.error}>
                <Ionicons name="alert-circle" size={16} color={Colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </View>
        ) : step === "payment" ? (
          <View style={styles.form}>
            <Text style={styles.stepTitle}>{t("payTitle")}</Text>
            <Text style={styles.formHint}>{t("payHint")}</Text>

            {/* Amount */}
            <View style={styles.payAmount}>
              <Text style={styles.payAmountLabel} numberOfLines={1}>
                {t("amountToPay")} · {quantity}x {listing.title}
              </Text>
              <Text style={styles.payAmountValue}>{formatMoney(listing.currency, total + deliveryFee)}</Text>
              {deliveryFee > 0 && (
                <Text style={styles.payAmountNote}>
                  {t("inclDeliveryShort", { fee: formatMoney(listing.currency, deliveryFee) })}
                </Text>
              )}
              {!quote?.configured && (
                <Text style={[styles.payAmountNote, { color: "#FDE68A" }]}>{t("deliveryOnArrival")}</Text>
              )}
            </View>

            <Text style={styles.payLabel}>{t("choosePaidTo")}</Text>
            {accounts.map((account) => {
              const style = PROVIDER[account.provider] ?? PROVIDER.other!;
              const on = paidWith === account.id;
              return (
                <Pressable
                  key={account.id}
                  onPress={() => {
                    setPaidWith(account.id);
                    setError("");
                  }}
                  style={[styles.payCard, on && styles.payCardOn]}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                >
                  <View style={[styles.payBadge, { backgroundColor: style.bg }]}>
                    <Text style={[styles.payBadgeText, { color: style.text }]}>{style.short}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.payProvider}>{account.provider_label}</Text>
                    <Text style={styles.payNumber} selectable>
                      {account.number}
                    </Text>
                    <Text style={styles.payName} numberOfLines={1}>
                      {account.account_name}
                    </Text>
                    {!!account.note && <Text style={styles.payNote}>{account.note}</Text>}
                  </View>
                  <Pressable onPress={() => copyNumber(account)} hitSlop={6} style={styles.copyBtn}>
                    <Ionicons
                      name={copied === account.id ? "checkmark-circle" : "copy-outline"}
                      size={15}
                      color={copied === account.id ? Colors.success : Colors.textMuted}
                    />
                    <Text style={styles.copyText}>{copied === account.id ? t("copied") : t("copy")}</Text>
                  </Pressable>
                  <View style={[styles.radio, on && styles.radioOn]}>{on && <View style={styles.radioDot} />}</View>
                </Pressable>
              );
            })}

            <Text style={[styles.payLabel, { textTransform: "none", letterSpacing: 0 }]}>{t("transactionId")}</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="receipt-outline" size={18} color={Colors.textFaint} />
              <TextInput
                value={reference}
                onChangeText={(v) => setReference(v.toUpperCase())}
                placeholder={t("transactionPlaceholder")}
                placeholderTextColor={Colors.textFaint}
                style={[styles.input, { fontWeight: "800", letterSpacing: 1 }]}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={100}
                returnKeyType="send"
                onFocus={revealField}
                onSubmitEditing={submit}
              />
            </View>

            {!!error && (
              <View style={styles.error}>
                <Ionicons name="alert-circle" size={16} color={Colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.formHint}>{t("contactHint")}</Text>

            {/* Summary */}
            <View style={styles.summary}>
              {uri ? (
                <Image source={{ uri }} style={styles.summaryImage} contentFit="cover" />
              ) : (
                <View style={[styles.summaryImage, { alignItems: "center", justifyContent: "center" }]}>
                  <Ionicons name={isService ? "construct-outline" : "bag-handle-outline"} size={24} color={Colors.textFaint} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.summaryTitle} numberOfLines={2}>
                  {listing.title}
                </Text>
                <Text style={styles.summaryMeta}>
                  {isService ? "SokoLink" : `${quantity}x · SokoLink`}
                </Text>
              </View>
              {isService ? (
                <PriceText price={listing.price} currency={listing.currency} isService size={13} />
              ) : (
                <Text style={styles.summaryPrice}>{formatMoney(listing.currency, total)}</Text>
              )}
            </View>
            {isService && <Text style={styles.serviceNote}>{t("servicePriceNote")}</Text>}

            <Field icon="person-outline" label={t("yourName")}>
              <TextInput
                value={name}
                onChangeText={(v) => {
                  setName(v);
                  setError("");
                }}
                placeholder={t("namePlaceholder")}
                placeholderTextColor={Colors.textFaint}
                style={styles.input}
                autoCapitalize="words"
                maxLength={120}
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => phoneRef.current?.focus()}
              />
            </Field>
            <Field icon="call-outline" label={t("mobileNumber")}>
              <TextInput
                value={phone}
                onChangeText={(v) => {
                  setPhone(v);
                  setError("");
                }}
                placeholder={t("phonePlaceholder")}
                placeholderTextColor={Colors.textFaint}
                ref={phoneRef}
                style={styles.input}
                keyboardType="phone-pad"
                maxLength={20}
                returnKeyType="next"
                submitBehavior="submit"
                onFocus={revealField}
                onSubmitEditing={goToLocation}
              />
            </Field>
            {!!error && (
              <View style={styles.error}>
                <Ionicons name="alert-circle" size={16} color={Colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Bottom actions */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {step === "details" ? (
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Button
              title={t("addToCart")}
              icon="cart-outline"
              variant="outline"
              style={{ flex: 1 }}
              onPress={() => {
                addToCart(listing, quantity);
                Alert.alert(t("addedToCart"), `${quantity}x ${listing.title}`);
              }}
            />
            <Button title={t("orderNow")} icon="flash" style={{ flex: 1.2 }} onPress={() => setStep("contact")} />
          </View>
        ) : step === "contact" ? (
          <View style={{ gap: 8 }}>
            <Button title={t("continue")} icon="arrow-forward" onPress={goToLocation} />
            {!isService && (
              <Button
                title={t("back")}
                icon="arrow-back"
                variant="ghost"
                onPress={() => {
                  setError("");
                  setStep("details");
                }}
                style={{ height: 36 }}
              />
            )}
          </View>
        ) : step === "payment" ? (
          <View style={{ gap: 6 }}>
            <Button
              title={submitting ? t("submitting") : t("iHavePaid")}
              icon="checkmark-done-circle"
              loading={submitting}
              disabled={!paidWith}
              onPress={submit}
              style={{ backgroundColor: Colors.success }}
            />
            <Text style={styles.payFooterNote}>{t("weCheckPayment")}</Text>
            <Button
              title={t("back")}
              icon="arrow-back"
              variant="ghost"
              onPress={() => {
                setError("");
                setStep("location");
              }}
              disabled={submitting}
              style={{ height: 36 }}
            />
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            <Button
              title={
                submitting
                  ? t("submitting")
                  : payFirst
                    ? t("continueToPay")
                    : isService
                      ? t("confirmBooking")
                      : t("confirmOrder")
              }
              icon={payFirst ? "wallet" : "checkmark-circle"}
              loading={submitting}
              disabled={locating}
              onPress={confirmLocation}
            />
            <Button
              title={t("back")}
              icon="arrow-back"
              variant="ghost"
              onPress={() => {
                setError("");
                setStep("contact");
              }}
              disabled={submitting}
              style={{ height: 36 }}
            />
          </View>
        )}
      </View>
    </View>
  );
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginTop: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <Ionicons name={icon} size={18} color={Colors.textFaint} />
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 300,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  heroImage: { width: "100%", height: "100%" },
  sale: {
    position: "absolute",
    top: 14,
    left: 14,
    backgroundColor: Colors.danger,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  saleText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  sheet: {
    marginTop: -18,
    backgroundColor: Colors.background,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: 20,
  },
  store: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "#FFF7ED",
    borderRadius: Radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  storeText: { fontSize: 12, fontWeight: "800", color: Colors.navy },
  title: { marginTop: 12, fontSize: 22, fontWeight: "900", color: Colors.navy, lineHeight: 28 },
  category: { marginTop: 4, fontSize: 12, fontWeight: "700", color: Colors.textMuted },
  priceBox: {
    marginTop: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EEF2F6",
    ...Shadow.card,
  },
  priceLabel: { fontSize: 11, fontWeight: "800", color: Colors.textMuted, textTransform: "uppercase" },
  priceBig: { fontSize: 28, fontWeight: "900", color: Colors.primary },
  priceEach: { marginTop: 2, fontSize: 12, color: Colors.textMuted, fontWeight: "600" },
  priceOld: { marginTop: 2, fontSize: 12, color: Colors.textFaint, textDecorationLine: "line-through" },
  description: { marginTop: 16, fontSize: 14, lineHeight: 21, color: Colors.textMuted },
  label: {
    marginTop: 18,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: "800",
    color: Colors.navy,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  stepper: { flexDirection: "row", alignItems: "center", gap: 14 },
  stepBtn: {
    width: 46,
    height: 46,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  stepValue: { minWidth: 40, textAlign: "center", fontSize: 22, fontWeight: "900", color: Colors.navy },
  form: { padding: 20 },
  formHint: { fontSize: 13, lineHeight: 19, color: Colors.textMuted },
  summary: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: Radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: "#EEF2F6",
  },
  summaryImage: { width: 56, height: 56, borderRadius: Radius.md, backgroundColor: "#F1F5F9" },
  summaryTitle: { fontSize: 14, fontWeight: "800", color: Colors.navy },
  summaryMeta: { marginTop: 2, fontSize: 12, color: Colors.textMuted },
  summaryPrice: { fontSize: 14, fontWeight: "900", color: Colors.primary },
  serviceNote: { marginTop: 8, fontSize: 11.5, color: Colors.textMuted },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 52,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: "#FFFFFF",
  },
  input: { flex: 1, fontSize: 15, fontWeight: "600", color: Colors.text },
  error: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.dangerBg,
    borderRadius: Radius.md,
    padding: 12,
  },
  errorText: { flex: 1, fontSize: 13, fontWeight: "700", color: Colors.danger },
  stepTitle: { fontSize: 22, fontWeight: "900", color: Colors.navy, marginBottom: 6 },
  payAmount: { marginTop: 14, padding: 16, borderRadius: Radius.lg, backgroundColor: Colors.navy },
  payAmountLabel: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: "700" },
  payAmountValue: { marginTop: 4, color: "#FFFFFF", fontSize: 28, fontWeight: "900" },
  payAmountNote: { marginTop: 2, color: "rgba(255,255,255,0.6)", fontSize: 11.5 },
  payLabel: {
    marginTop: 18,
    marginBottom: 8,
    fontSize: 11.5,
    fontWeight: "900",
    color: Colors.textFaint,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  payCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    marginBottom: 10,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: "#FFFFFF",
  },
  payCardOn: { borderColor: Colors.primary, backgroundColor: "#FFF7ED" },
  payBadge: { width: 50, height: 50, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  payBadgeText: { fontSize: 11, fontWeight: "900" },
  payProvider: { fontSize: 11.5, fontWeight: "800", color: Colors.textMuted },
  payNumber: { fontSize: 20, fontWeight: "900", color: Colors.navy, letterSpacing: 1.5 },
  payName: { fontSize: 12, fontWeight: "700", color: Colors.textMuted },
  payNote: { marginTop: 2, fontSize: 11, color: Colors.textFaint },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
  },
  copyText: { fontSize: 11.5, fontWeight: "800", color: Colors.textMuted },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOn: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FFFFFF" },
  payFooterNote: { textAlign: "center", fontSize: 11.5, color: Colors.textFaint },
  mapCard: {
    marginTop: 16,
    height: 280,
    borderRadius: Radius.lg,
    overflow: "hidden",
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  mapEmpty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, paddingBottom: 48 },
  mapEmptyText: { textAlign: "center", fontSize: 12, color: Colors.textMuted, fontWeight: "600" },
  mapBusy: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15,36,59,0.55)",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  mapBusyText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  mapButton: {
    position: "absolute",
    bottom: 14,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    height: 46,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    ...Shadow.card,
  },
  mapButtonSecondary: { backgroundColor: "#FFFFFF" },
  mapButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" },
  locationMeta: { marginTop: 2, fontSize: 11.5, color: Colors.textMuted },
  locationError: { marginTop: 8, fontSize: 12, fontWeight: "700", color: Colors.danger },
  totals: {
    marginTop: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EEF2F6",
    gap: 6,
  },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 13, color: Colors.textMuted, fontWeight: "600" },
  totalValue: { fontSize: 13, color: Colors.navy, fontWeight: "800" },
  grandRow: { marginTop: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#EEF2F6" },
  grandLabel: { fontSize: 15, fontWeight: "900", color: Colors.navy },
  grandValue: { fontSize: 17, fontWeight: "900", color: Colors.primary },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
});
