import {
  Text,
  StyleSheet,
  View,
  Platform,
  ActivityIndicator,
} from "react-native";
import { FlatList } from "react-native-gesture-handler";
import Colors from "@/app/constants/Colors";
import RoundBtn from "@/app/components/RoundBtn";
import { defaultStyles } from "@/app/constants/Styles";
import { Ionicons } from "@expo/vector-icons";
import WidgetList from "@/app/components/SortableList/WidgetList";
import { useHeaderHeight } from "@react-navigation/elements";
import { useEffect, useState, useCallback } from "react";
import { useContext } from "react";
import { UserIDContext } from "@/app/context/UserID";
import { useRouter } from "expo-router";

const Home = () => {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const headerHeight = useHeaderHeight();
  const userIDContext = useContext(UserIDContext);
  const router = useRouter();
  

  const [connectedAccounts, setConnectedAccounts] = useState<any[]>([]);
  const [isFetched, setIsFetched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCleared, setIsCleared] = useState(false);
  const [transctionsFetched, setTransactionsFetched] = useState(false);

  if (!userIDContext) {
    throw new Error("UserIDContext is null");
  }

  const { userID } = userIDContext;

  const address = Platform.OS === "ios" ? "localhost" : "10.0.2.2";

  const createLinkToken = useCallback(async () => {
    await fetch(`http://${address}:8000/create_link_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ address: address }),
    })
      .then((response) => response.json())
      .then((data) => {
        setLinkToken(data.link_token);
      })
      .catch((err) => {
        console.error(err);
      });
  }, [setLinkToken]);

  const fetchConnectedAccounts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`http://${address}:8000/check_clerk_id`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clerk_id: userID,
        }),
      });
      const data = await response.json();
      if (!data.exists) {
        return;
      } else {
        const accessTokens = data.user.access_token;
        const promises = accessTokens.map((access_token: string) =>
          fetch(`http://${address}:8000/get_balance`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              access_token: access_token,
            }),
          })
            .then((response) => response.json())
            .then(async (data) => {
              // Call sync_transactions endpoint after getting balance
              return fetch(`http://${address}:8000/sync_transactions`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  access_token: access_token,
                }),
              })
                .then((response) => response.json())
                .then((transactionsData) => {
                  // Combine balance data and transactions data
                  return { ...data, transactions: transactionsData };
                })
                .catch((err) => {
                  console.error("Error:", err);
                })
                .finally(() => {
                  setIsLoading(false);
                });
            })
        );

        Promise.all(promises)
          .then(async (data) => {
            const accounts = data.flatMap((d) => d.accounts);
            setConnectedAccounts(accounts);
            const sendTransactions = data.flatMap((d) => {
              return d.transactions.added.map((transaction: any) => {
                return {
                  account_id: transaction?.account_id,
                  id: transaction?.transaction_id,
                  title: transaction?.name,
                  amount: transaction?.amount,
                  date: transaction?.date,
                };
              });
            });

            await fetch (`http://${address}:8000/store_transactions`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                clerk_id: userID,
                accounts: accounts,
                transactions: sendTransactions,
              }),
            })
            .then((response) => response.json())
            setIsFetched(true);
          })
          .catch((error) => {
            console.error("Error:", error);
          })
          .finally(() => {
            fetchTransactions();
          });
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error:", error.message);
      }
    }
  };

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
      setTransactions(data.transactions); // Store the transactions in state
      setTransactionsFetched(true);
      return data.transactions; // Return the transactions
    } catch (error) {
      console.log('Failed to fetch transactions:', error);
      setTransactions([]); // If an error occurs, set transactions to an empty array
    }
  }

  useEffect(() => {
    if (linkToken != null) {
      createLinkToken();
    }
  }, [linkToken]);
  
  useEffect(() => {
    if (userID != null && !isFetched) {
      fetchConnectedAccounts();
    }
  }, [userID, isFetched]);
  
  useEffect(() => {
    if (isCleared) {
      fetchConnectedAccounts();
      setIsCleared(false);
    }
  }, [isCleared]);

  return (
    <>
      <FlatList
        style={{ backgroundColor: Colors.background }}
        contentContainerStyle={{
          paddingTop: headerHeight,
        }}
        data={transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            <View style={styles.account}>
              <Text style={defaultStyles.sectionHeader}>Money Available</Text>
              <View>
                {isLoading ? (
                  <ActivityIndicator size="large" color={Colors.primary} />
                ) : (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-end",
                      gap: 10,
                    }}
                  >
                    <Text style={styles.currency}>$</Text>
                    <Text style={styles.balance}>
                      {connectedAccounts
                        .map((account: any) => account.balances.available)
                        .reduce((acc, balance) => acc + balance, 0)
                        .toFixed(2)}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.actionRow}>
              <RoundBtn
                text={"Refresh"}
                icon="refresh"
                onPress={async () => {
                  // Clear the transactions
                  setIsCleared(true);

                  // Navigate to the "home" route to refresh the page
                  router.navigate("home");
                }}
              />
            </View>

            <Text style={defaultStyles.sectionHeader}>Transactions</Text>
          </>
        }
        renderItem={({ item: transaction }) => (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 16,
              paddingLeft: 20,
              paddingRight: 20,
              paddingBottom: 10,
            }}
          >
            <View style={styles.circle}>
              <Ionicons name={"remove"} size={24} color={Colors.dark} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "400" }}>
                {transaction.title.length > 12
                  ? transaction.title.substring(0, 12) + "..."
                  : transaction.title}
              </Text>
              <Text style={{ color: Colors.gray, fontSize: 12 }}>
                {transaction.date.toString()}
              </Text>
            </View>
            <Text>${transaction.amount}</Text>
          </View>
        )}
        ListFooterComponent={
          <>
            {isLoading ? (
              <ActivityIndicator size="large" color={Colors.primary} />
            ) : (
              <>
                <Text style={defaultStyles.sectionHeader}>Widgets</Text>
                <WidgetList />
              </>
            )}
          </>
        }
      />
    </>
  );
};

const styles = StyleSheet.create({
  account: {
    margin: 60,
    alignItems: "center",
  },
  balance: {
    fontSize: 40,
    fontWeight: "bold",
  },
  currency: {
    fontSize: 30,
    fontWeight: "bold",
  },
  actionRow: {
    padding: 10,
    alignContent: "center",
  },
  transactions: {
    margin: 20,
    padding: 14,
    backgroundColor: "#fff",
    borderRadius: 16,
    gap: 20,
  },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray,
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.lightGray,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default Home;
