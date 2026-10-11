import { useCallback } from "react";
import { View } from "react-native";

import { AppHeader } from "@/components/AppHeader";
import { ListingScreen } from "@/components/ListingScreen";
import { Colors } from "@/constants/theme";
import { fetchCatalog } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";

export default function ServicesScreen() {
  const { t } = useLanguage();
  const load = useCallback(async () => (await fetchCatalog({ type: "service" })).services, []);
  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <AppHeader title={t("ourServices")} subtitle={t("servicePriceNote")} />
      <ListingScreen load={load} emptyIcon="construct-outline" emptyTitle={t("noServices")} />
    </View>
  );
}
