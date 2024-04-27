import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Currency } from "@/app/interfaces/crypto";
import { Link } from "expo-router";
import { useHeaderHeight } from "@react-navigation/elements";
import Colors from "@/app/constants/Colors";
import { defaultStyles } from "@/app/constants/Styles";
import { Ionicons } from "@expo/vector-icons";

const Page = () => {
  const headerHeight = useHeaderHeight();

  const currencies = useQuery({
    queryKey: ["listings"],
    queryFn: () => fetch("/api/listings").then((res) => res.json()),
  });

  const ids = currencies.data
    ?.map((currency: Currency) => currency.id)
    .join(",");

  const { data } = useQuery({
    queryKey: ["info", ids],
    queryFn: () => fetch(`/api/info?ids=${ids}`).then((res) => res.json()),
    enabled: !!ids,
  });

  function percentChange(curreny: Currency) {
    if (curreny.quote.USD.percent_change_24h > 0) {
      return (
        <View style={{ flexDirection: "row", gap: 4 }}>
          <Ionicons name="arrow-up" size={14} color="green" />
          <Text style={{ color: "green" }}>
            {curreny.quote.USD.percent_change_24h.toFixed(2)}%
          </Text>
        </View>
      );
    } else {
      return (
        <View style={{ flexDirection: "row", gap: 4 }}>
          <Ionicons name="arrow-down" size={14} color="red" />
          <Text style={{ color: "red" }}>
            {curreny.quote.USD.percent_change_24h.toFixed(2)}%
          </Text>
        </View>
      );
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: Colors.background }}
      contentContainerStyle={{ paddingTop: headerHeight }}
    >
      <Text style={defaultStyles.sectionHeader}>Latest Crypto</Text>
      <View style={defaultStyles.block}>
        {currencies.data?.map((currency: Currency) => (
          <Link href={`/crypto/${currency.id}`} key={currency.id} asChild>
            <TouchableOpacity style={styles.sectionItem}>
              <Image
                source={{ uri: data?.[currency.id].logo }}
                style={{ width: 40, height: 40 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "600", color: Colors.dark }}>
                  {currency.name}
                </Text>
                <Text style={{ color: Colors.gray }}>{currency.symbol}</Text>
              </View>
              <View style={{alignItems:'flex-end'}}>
                <Text>{currency.quote.USD.price.toFixed(2)} $</Text>
                {percentChange(currency)}
              </View>
            </TouchableOpacity>
          </Link>
        ))}
      </View>
    </ScrollView>
  );
};

export default Page;

const styles = StyleSheet.create({
  sectionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
});
