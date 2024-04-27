import React, { useState, useEffect, useCallback } from "react";
import {
  Platform,
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { PlaidLink, LinkExit } from "react-native-plaid-link-sdk";
import { useHeaderHeight } from "@react-navigation/elements";
import { UserIDContext } from "@/app/context/UserID";
import { useContext } from "react";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/app/constants/Colors";

var styles = require("@/app/constants/style");

const bank = ({ navigation }: any) => {
  const [linkToken, setLinkToken] = useState(null);
  const address = Platform.OS === "ios" ? "localhost" : "10.0.2.2";
  const headerHeight = useHeaderHeight();
  const userIDContext = useContext(UserIDContext);

  if (!userIDContext) {
    throw new Error("UserIDContext is null");
  }

  const { userID } = userIDContext;

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
        console.log(err);
      });
  }, [setLinkToken]);

  useEffect(() => {
    if (linkToken == null) {
      createLinkToken();
    }
  }, [linkToken]);

  const updateUserBank = async ({ access_token, items }: any) => {
    if (access_token) {
      await fetch(`http://${address}:8000/update_user_data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clerk_id: userID,
          access_token,
          items,
        }),
      })
        .then((response) => response.json())
        .catch((error) => {
          console.error("Error:", error);
        });
    } else {
      console.error("Access token is missing");
    }
  };

  const [connectedAccounts, setConnectedAccounts] = useState<any[]>([]);
  const [isFetched, setIsFetched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
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
              .then((data) => {
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
                  });
              })
          );
          Promise.all(promises)
            .then((data) => {
              const accounts = data.flatMap((d) => d.accounts);
              setConnectedAccounts(accounts);
              setIsFetched(true);
              setIsLoading(false);
            })
            .catch((error) => {
              console.error("Error:", error);
            });
        }
      } catch (error) {
        console.error("Error:", error);
      }
    };

    if (userID && !isFetched) {
      fetchConnectedAccounts();
    }
  }, [userID, isFetched]);

  useEffect(() => {
    setIsFetched(false);
  }, [connectedAccounts.length]);

  return (
    <>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Connect to Bank button */}
        <View style={styles.bottom}>
          <PlaidLink
            tokenConfig={{
              token: linkToken!,
            }}
            onSuccess={(success) => {
              setIsFetched(false);
              fetch(`http://${address}:8000/exchange_public_token`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  public_token: success.publicToken,
                  metadata: success.metadata,
                }),
              })
                .then((response) => response.json())
                .then((data) => {
                  updateUserBank({
                    access_token: data.accessToken,
                    items: data.itemId,
                  });
                })
                .catch((err) => {
                  console.error(err);
                });
            }}
            onExit={(response: LinkExit) => {
              setIsFetched(false);
            }}
          >
            <View style={styles.buttonContainer}>
              <Text style={styles.buttonText}>Connect</Text>
            </View>
          </PlaidLink>
        </View>
        <View>
          {isLoading ? (
            <ActivityIndicator size="large" color="#0000ff" />
          ) : (
            connectedAccounts.map((account: any, index: number) => (
              <View style={style.card} key={index}>
                <View>
                  <Text style={{ fontWeight: "600" }}>
                    Bank{account.institution_name}
                  </Text>
                  <Text>{account.official_name}</Text>
                </View>
                <View style={style.banks}>
                  <View style={style.circle}>
                    <Ionicons name="cash-outline" size={24} color="black" />
                  </View>
                  <View style={{ flexDirection: "column" }}>
                    <Text style={{ fontWeight: "400" }}>{account.name}</Text>
                    <Text style={{ color: Colors.gray, fontSize: 12 }}>
                      {`${account.subtype}`.toUpperCase()}
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: "column",
                      flex: 1,
                      alignItems: "flex-end",
                    }}
                  >
                    <Text>Current: ${account.balances.current.toFixed(2)}</Text>
                    <Text>Available: ${account.balances.available.toFixed(2)}</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </>
  );
};

export default bank;

const style = StyleSheet.create({
  card: {
    flexDirection: "column",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    margin: 20,
  },
  banks: {
    flexDirection: "row",
    margin: 20,
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
