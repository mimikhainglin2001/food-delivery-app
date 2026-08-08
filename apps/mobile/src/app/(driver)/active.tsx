import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/lib/axios";
import { Order } from "@food-delivery/types";

type DriverOrder = Order & {
  restaurant: { id: string; name: string };
};

const STATUS_COLORS: Record<string, string> = {
  READY: "#06B6D4",
  PICKED_UP: "#FF6B35",
  DELIVERED: "#22C55E",
  CANCELLED: "#EF4444",
};

function ActiveCard({ order }: { order: DriverOrder }) {
  const queryClient = useQueryClient();
  const statusColor = STATUS_COLORS[order.status] ?? "#999";
  const isPickedUp = order.status === "PICKED_UP";

  const { mutate: updateStatus, isPending } = useMutation({
    mutationFn: (status: "PICKED_UP" | "DELIVERED") =>
      api.patch(`/orders/${order.id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driver-orders"] });
      queryClient.invalidateQueries({ queryKey: ["driver-active-orders"] });
    },
    onError: (e: any) =>
      Alert.alert("Error", e?.response?.data?.message ?? "Something went wrong"),
  });

  const { mutate: decline, isPending: declining } = useMutation({
    mutationFn: () => api.post(`/driver/orders/${order.id}/decline`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driver-orders"] });
      queryClient.invalidateQueries({ queryKey: ["driver-active-orders"] });
    },
    onError: (e: any) =>
      Alert.alert("Error", e?.response?.data?.message ?? "Something went wrong"),
  });

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.restaurant}>
          {order.restaurant?.name ?? "Restaurant"}
        </Text>
        <View
          style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}
        >
          <Text style={[styles.statusText, { color: statusColor }]}>
            {isPickedUp ? "ON DELIVERY" : "READY TO PICK UP"}
          </Text>
        </View>
      </View>

      <Text style={styles.address} numberOfLines={1}>
        📍 {order.deliveryAddress}
      </Text>

      <View style={styles.cardFooter}>
        <Text style={styles.total}>${Number(order.totalAmount).toFixed(2)}</Text>
        <Text style={styles.orderId}>
          #{order.id.slice(0, 8).toUpperCase()}
        </Text>
      </View>

      <View style={styles.actions}>
        {!isPickedUp ? (
          <Pressable
            style={[styles.pickupButton, isPending && styles.buttonDisabled]}
            onPress={() => updateStatus("PICKED_UP")}
            disabled={isPending}
          >
            {isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.pickupButtonText}>Pick Up Order</Text>
            )}
          </Pressable>
        ) : (
          <Pressable
            style={[styles.deliveredButton, isPending && styles.buttonDisabled]}
            onPress={() => updateStatus("DELIVERED")}
            disabled={isPending}
          >
            {isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.deliveredButtonText}>Mark as Delivered</Text>
            )}
          </Pressable>
        )}

        {!isPickedUp && (
          <Pressable
            style={[styles.declineButton, declining && styles.buttonDisabled]}
            onPress={() => decline()}
            disabled={declining}
          >
            <Text style={styles.declineButtonText}>Decline</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default function DriverActiveScreen() {
  const { data: orders = [], isLoading } = useQuery<DriverOrder[]>({
    queryKey: ["driver-active-orders"],
    queryFn: () => api.get<DriverOrder[]>("/orders/mine").then((r) => r.data),
  });

  const activeOrders = orders.filter((o) =>
    ["READY", "PICKED_UP"].includes(o.status),
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#FF6B35" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.title}>Active Deliveries</Text>

      {activeOrders.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No active orders</Text>
          <Text style={styles.emptySubText}>
            Orders ready for pickup will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={activeOrders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <ActiveCard order={item} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: "#f9f9f9",
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  restaurant: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flexShrink: 1,
  },
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  address: {
    fontSize: 14,
    color: "#555",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  total: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  orderId: {
    fontSize: 13,
    color: "#999",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  pickupButton: {
    flex: 1,
    backgroundColor: "#06B6D4",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  pickupButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  deliveredButton: {
    flex: 1,
    backgroundColor: "#22C55E",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  deliveredButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  declineButton: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  declineButtonText: {
    color: "#EF4444",
    fontSize: 15,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
});
