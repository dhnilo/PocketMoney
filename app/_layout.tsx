import React from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useRouter, Link, Stack, useSegments } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SecureStore from "expo-secure-store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useNavigationContainerRef } from "expo-router";
import { ApolloProvider } from '@apollo/client';
import client from '@/app/apollo/client';

import Colors from "./constants/Colors";
import { UserInactivityProvider } from "@/app/context/UserInactivity";
import { UserIDProvider } from "./context/UserID";

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Create a new QueryClient
const queryClient = new QueryClient();

// Cache the Clerk JWT
const tokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const InitialLayout = () => {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const navigationRef = useNavigationContainerRef();
  const [userID, setUserID] = React.useState<string | null>(null);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    if (!isLoaded || !navigationRef.isReady()) return;

    const inAuthGroup = segments[0] === "(authenticated)";

    if (isSignedIn && !inAuthGroup) {
      router.push("/(authenticated)/(tabs)/home");
    } else if (!isSignedIn && inAuthGroup) {
      router.replace("/");
    }
  }, [isSignedIn, navigationRef]);

  if (!loaded || !isLoaded) {
    return <Text>Loading...</Text>;
  }

  return (
    <UserIDProvider value={{ userID, setUserID }}>
      <Stack>
        {/* Unauthenticated routes or initial screen */}
        <Stack.Screen name="index" options={{ headerShown: false }} />

        {/* Signup route */}
        <Stack.Screen
          name="signup"
          options={{
            title: "",
            headerBackTitle: "",
            headerShadowVisible: false,
            headerStyle: { backgroundColor: Colors.background },
            headerLeft: () => (
              <TouchableOpacity onPress={router.back}>
                <Ionicons name="arrow-back" size={24} color={Colors.dark} />
              </TouchableOpacity>
            ),
          }}
        />

        {/* Login route */}
        <Stack.Screen
          name="login"
          options={{
            title: "",
            headerBackTitle: "",
            headerShadowVisible: false,
            headerStyle: { backgroundColor: Colors.background },
            headerLeft: () => (
              <TouchableOpacity onPress={router.back}>
                <Ionicons name="arrow-back" size={24} color={Colors.dark} />
              </TouchableOpacity>
            ),
            headerRight: () => (
              <Link href={"/help"} asChild>
                <TouchableOpacity>
                  <Ionicons
                    name="help-circle-outline"
                    size={24}
                    color={Colors.dark}
                  />
                </TouchableOpacity>
              </Link>
            ),
          }}
        />

        {/* Help route */}
        <Stack.Screen
          name="help"
          options={{
            title: "Help",
            presentation: "modal",
          }}
        />

        {/* Passwordless authentication routes */}
        <Stack.Screen
          name="verify/[phone]"
          options={{
            title: "",
            headerBackTitle: "",
            headerShadowVisible: false,
            headerStyle: { backgroundColor: Colors.background },
            headerLeft: () => (
              <TouchableOpacity onPress={router.back}>
                <Ionicons name="arrow-back" size={24} color={Colors.dark} />
              </TouchableOpacity>
            ),
          }}
        />

        {/* Authenticated routes */}
        <Stack.Screen
          name="(authenticated)/(tabs)"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="(authenticated)/crypto/[id]"
          options={{
            title: "",
            headerLargeTitle: true,
            headerTransparent: true,
            headerStyle: { backgroundColor: Colors.background },
            headerLeft: () => (
              <TouchableOpacity onPress={router.back}>
                <Ionicons name="arrow-back" size={24} color={Colors.dark} />
              </TouchableOpacity>
            ),
            headerRight: () => (
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity>
                  <Ionicons
                    name="notifications-outline"
                    size={24}
                    color={Colors.dark}
                  />
                </TouchableOpacity>
                <TouchableOpacity>
                  <Ionicons name="star-outline" size={24} color={Colors.dark} />
                </TouchableOpacity>
              </View>
            ),
          }}
        />
        <Stack.Screen
          name="(authenticated)/(modals)/lock"
          options={{ headerShown: false, animation: "none" }}
        />
        <Stack.Screen
          name="(authenticated)/(modals)/account"
          options={{
            presentation: "transparentModal",
            animation: "fade",
            title: "",
            headerTransparent: true,
            headerLeft: () => (
              <TouchableOpacity onPress={router.back}>
                <Ionicons name="close-outline" size={34} color={"#fff"} />
              </TouchableOpacity>
            ),
          }}
        />
      </Stack>
    </UserIDProvider>
  );
};

const RootLayoutNav = () => {
  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY!}
      tokenCache={tokenCache}
    >
      <ApolloProvider client={client}>
      <QueryClientProvider client={queryClient}>
        <UserInactivityProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <StatusBar style="light" />
            <InitialLayout />
          </GestureHandlerRootView>
        </UserInactivityProvider>
      </QueryClientProvider>
      </ApolloProvider>
    </ClerkProvider>
  );
};

export default RootLayoutNav;
