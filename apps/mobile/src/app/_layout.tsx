import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { AuthProvider, useAuth } from "@/context/auth-context";
import { Stack } from "expo-router";
import { UserRole } from "@food-delivery/types";
import { StripeProvider } from "@stripe/stripe-react-native";

const queryClient = new QueryClient();

function RootNavigator() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="health" />

      <Stack.Protected guard={!user}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
      </Stack.Protected>

      <Stack.Protected guard={!!user && user.role === UserRole.CUSTOMER}>
        <Stack.Screen name="(customer)" />
      </Stack.Protected>

      <Stack.Protected
        guard={!!user && user.role === UserRole.RESTAURANT_OWNER}
      >
        <Stack.Screen name="(owner)" />
      </Stack.Protected>
      <Stack.Protected guard={!!user && user.role === UserRole.DRIVER}>
        <Stack.Screen name="(driver)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function TabLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StripeProvider
        publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
      >
        <AuthProvider>
          <AnimatedSplashOverlay />
          <RootNavigator />
        </AuthProvider>
      </StripeProvider>
    </QueryClientProvider>
  );
}
