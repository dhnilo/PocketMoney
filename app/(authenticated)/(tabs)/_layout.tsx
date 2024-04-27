import React from "react";
import { Tabs } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import Colors from "@/app/constants/Colors";
import { BlurView } from "expo-blur";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useContext, useEffect } from "react";
import { UserIDContext } from "@/app/context/UserID";

import { QueryClient, QueryClientProvider } from "react-query";

import CustomHeader from "@/app/components/CustomHeader";

const queryClient = new QueryClient();

const Layout = () => {
  const userIDContext = useContext(UserIDContext);

  if (!userIDContext) {
    throw new Error("UserIDContext is null");
  }

  const { setUserID, userID } = userIDContext;

  // Save the userID
  const saveUserID = async (userID: string) => {
    try {
      await AsyncStorage.setItem("@userID", userID);
    } catch (e) {
      // saving error
    }
  };

  // Load the userID
  const loadUserID = async () => {
    try {
      const value = await AsyncStorage.getItem("@userID");
      if (value !== null) {
        // value previously stored
        setUserID(value);
      }
      if (value !== null) {
        // value previously stored
        return value;
      }
    } catch (e) {
      // error reading value
    }
  };

  // Call saveUserID whenever userID changes
  useEffect(() => {
    saveUserID(userID!);
  }, [userID]);

  // Call loadUserID once when the component mounts
  useEffect(() => {
    loadUserID();
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarBackground: () => (
          <BlurView
            intensity={100}
            tint={"extraLight"}
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.05)",
            }}
          />
        ),
        tabBarStyle: {
          backgroundColor: "transparent",
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 0,
          borderTopWidth: 0,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ size, color }) => (
            <FontAwesome name="home" size={size} color={color} />
          ),
          header: () => <CustomHeader />,
          headerTransparent: true,
        }}
      />
      <Tabs.Screen
        name="invest"
        options={{
          title: "Invest",
          tabBarIcon: ({ size, color }) => (
            <FontAwesome name="line-chart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bank"
        options={{
          title: "Bank",
          tabBarIcon: ({ size, color }) => (
            <FontAwesome name="bank" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="crypto"
        options={{
          title: "Crypto",
          tabBarIcon: ({ size, color }) => (
            <FontAwesome name="bitcoin" size={size} color={color} />
          ),
          header: () => <CustomHeader />,
          headerTransparent: true,
        }}
      />
    </Tabs>
  );
};

const AuthLayout = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Layout />
    </QueryClientProvider>
  );
};

export default AuthLayout;
