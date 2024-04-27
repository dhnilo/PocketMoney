import React from "react";
import { StyleSheet, View, Text, Platform } from "react-native";

import { SIZE } from "./Config";
import Colors from "@/app/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useContext } from "react";
import { UserIDContext } from "@/app/context/UserID";
import { useState, useEffect } from "react";

const styles = StyleSheet.create({
  container: {
    width: SIZE - 20,
    height: 150,
    backgroundColor: "white",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 5,
    padding: 14,
    alignSelf: "center",
  },
});
interface TileProps {
  id: string;
  onLongPress: () => void;
}

const Tile = ({ id }: TileProps) => {
  const userIDContext = useContext(UserIDContext);
  const address = Platform.OS === "ios" ? "localhost" : "10.0.2.2";
  const [transactions, setTransactions] = useState<any[]>([]);

  if (!userIDContext) {
    throw new Error("UserIDContext is null");
  }

  const { userID } = userIDContext;

  useEffect(() => {
    const getTransactions = async () => {
      try {
        const transactionsFromServer = await fetchTransactions();
        setTransactions(transactionsFromServer);
      } catch (error) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    };
  
    getTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`http://${address}:8000/get_transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clerk_id: userID,
        }),
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.transactions;
    } catch (error) {
      console.log('Failed to fetch transactions:', error);
      return [];
    }
  }

  if (id === "spent") {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const spentThisMonth = transactions
      .filter((transaction) => new Date(transaction.date) >= oneMonthAgo)
      .reduce((total, transaction) => total + transaction.amount, 0);

    return (
      <View style={styles.container} pointerEvents="none">
        <Text style={{ color: Colors.gray, fontWeight: "500", fontSize: 16 }}>
          Spent this month
        </Text>
        <Text
          style={{
            color: Colors.dark,
            fontWeight: "bold",
            fontSize: 26,
            paddingTop: 10,
          }}
        >
          ${spentThisMonth.toFixed(2)}
        </Text>
      </View>
    );
  }

  if (id === "cashback") {
    return (
      <View
        style={[
          styles.container,
          { alignItems: "center", justifyContent: "center" },
        ]}
        pointerEvents="none"
      >
        <View
          style={{ alignItems: "center", justifyContent: "center", gap: 10 }}
        >
          <View
            style={{
              height: 60,
              width: 60,
              borderRadius: 30,
              backgroundColor: Colors.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 18 }}>
              5%
            </Text>
          </View>
          <Text
            style={{ color: Colors.gray, fontWeight: "bold", fontSize: 18 }}
          >
            Cashback
          </Text>
        </View>
      </View>
    );
  }

  if (id === "recent") {
    const sortedTransactions = transactions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return (
      <View style={styles.container} pointerEvents="none">
        <View>
          <Text style={{ color: Colors.gray, fontWeight: "500", fontSize: 16 }}>
            Recent transaction
          </Text>

          {transactions.length === 0 && (
            <Text
              style={{
                color: Colors.gray,
                fontWeight: "bold",
                fontSize: 18,
                paddingTop: 10,
              }}
            >
              No transactions
            </Text>
          )}

          {transactions.length > 0 && (
            <>
              <Text
                style={{
                  color: Colors.dark,
                  fontWeight: "bold",
                  fontSize: 18,
                  paddingVertical: 10,
                }}
              >
                ${sortedTransactions[0].amount}
              </Text>
              <Text
                style={{ color: Colors.gray, fontWeight: "bold", fontSize: 16 }}
              >
                {sortedTransactions[0].title}
              </Text>
            </>
          )}
        </View>
      </View>
    );
  }

  if (id === "cards") {
    return (
      <View style={styles.container} pointerEvents="none">
        <Text style={{ color: Colors.gray, fontWeight: "500", fontSize: 16 }}>
          Cards
        </Text>
        <Ionicons
          name="card"
          size={50}
          color={Colors.primaryMuted}
          style={{ marginTop: 20, alignSelf: "center" }}
        />
      </View>
    );
  }
};

export default Tile;
