import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnimatedSplashOverlay } from "@/components/animated-icon";
import AppTabs from "@/components/app-tabs";
import { AuthProvider } from "@/context/auth-context";

const queryClient = new QueryClient();

export default function TabLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AnimatedSplashOverlay />
        <AppTabs />
      </AuthProvider>
    </QueryClientProvider>
  );
}
