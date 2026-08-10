import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { io, Socket } from "socket.io-client";
import { api } from "@/lib/axios";
import { useAuth } from "@/context/auth-context";
import { Order } from "@food-delivery/types";

let socket: Socket | null = null;

export default function DriverHomeScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [incomingOrder, setIncomingOrder] = useState<Order | null>(null);

  // fetch current online/offline state from GET /driver/status
  const { data: status, isLoading } = useQuery<{ isOnline: boolean }>({
    queryKey: ["driver-status"],
    queryFn: () =>
      api.get<{ isOnline: boolean }>("/driver/status").then((r) => r.data),
  });

  // orders assigned to this driver that are ready to pick up
  const { data: pickupOrders = [], isLoading: pickupLoading } = useQuery<
    (Order & { restaurant?: { id: string; name: string } })[]
  >({
    queryKey: ["driver-ready-orders"],
    queryFn: () =>
      api
        .get<Order[]>("/orders/mine")
        .then((r) => r.data.filter((o) => o.status === "READY")),
  });

  // flip isOnline on the server via PATCH /driver/online
  const { mutate: toggleOnline, isPending: toggling } = useMutation({
    mutationFn: () => api.patch("/driver/online"),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["driver-status"] }),
  });

  // driver declines → POST /driver/orders/:id/decline
  const { mutate: declineOrder } = useMutation({
    mutationFn: (orderId: string) =>
      api.post(`/driver/orders/${orderId}/decline`),
    onSuccess: () => setIncomingOrder(null),
    onError: (e: any) =>
      Alert.alert(
        "Error",
        e?.response?.data?.message ?? e?.message ?? "Something went wrong",
      ),
  });

  // driver accepts → PATCH /orders/:id/status { status: 'PICKED_UP' }
  const { mutate: acceptOrder } = useMutation({
    mutationFn: (orderId: string) =>
      api.patch(`/orders/${orderId}/status`, { status: "PICKED_UP" }),
    onSuccess: () => {
      setIncomingOrder(null);
      queryClient.invalidateQueries({ queryKey: ["driver-active-orders"] });
      queryClient.invalidateQueries({ queryKey: ["driver-ready-orders"] });
      queryClient.invalidateQueries({ queryKey: ["driver-orders"] });
    },
    onError: (e: any) =>
      Alert.alert(
        "Error",
        e?.response?.data?.message ?? e?.message ?? "Something went wrong",
      ),
  });

  useEffect(() => {
    if (!user?.id) return;

    socket = io(`${process.env.EXPO_PUBLIC_SERVER_URL}/orders`, {
      transports: ["websocket"],
    });

    socket.emit("join:driver", user.id);

    // server pushes this when DriverService.assignDriver() runs
    socket.on("driver:assigned", (order: Order) => {
      setIncomingOrder(order);
    });

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, [user?.id]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#FF6B35" />
        </View>
      </SafeAreaView>
    );
  }

  const isOnline = status?.isOnline ?? false;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Driver Dashboard</Text>

        {/* online/offline toggle card */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>
              {isOnline ? "🟢 You are Online" : "🔴 You are Offline"}
            </Text>
            <Switch
              value={isOnline}
              onValueChange={() => {
                toggleOnline();
              }}
              disabled={toggling}
              trackColor={{ false: "#FECACA", true: "#86EFAC" }}
              thumbColor={isOnline ? "#22C55E" : "#EF4444"}
            />
          </View>
          <Text style={styles.statusSubtext}>
            {isOnline
              ? "You will receive delivery requests"
              : "Go online to start receiving orders"}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Orders to Pick Up</Text>
        {pickupLoading ? (
          <View style={styles.centeredSmall}>
            <ActivityIndicator color="#FF6B35" />
          </View>
        ) : pickupOrders.length === 0 ? (
          <Text style={styles.emptySubText}>
            No orders ready for pickup right now
          </Text>
        ) : (
          pickupOrders.map((order) => (
            <View key={order.id} style={styles.pickupCard}>
              <View style={styles.pickupHeader}>
                <Text style={styles.pickupRestaurant}>
                  {order.restaurant?.name ?? "Restaurant"}
                </Text>
                <Text style={styles.pickupTotal}>
                  ${Number(order.totalAmount).toFixed(2)}
                </Text>
              </View>
              <Text style={styles.pickupAddress} numberOfLines={1}>
                📍 {order.deliveryAddress}
              </Text>
              <Pressable
                style={styles.pickupButton}
                onPress={() => acceptOrder(order.id)}
              >
                <Text style={styles.pickupButtonText}>Pick Up Order</Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>

      {/* incoming order modal — shown when driver:assigned fires */}
      <Modal visible={!!incomingOrder} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>🛵 New Delivery Request</Text>

            <View style={styles.orderDetails}>
              <Text style={styles.orderLabel}>Order ID</Text>
              <Text style={styles.orderValue}>
                #{incomingOrder?.id.slice(0, 8).toUpperCase()}
              </Text>

              <Text style={styles.orderLabel}>Deliver to</Text>
              <Text style={styles.orderValue}>
                {incomingOrder?.deliveryAddress}
              </Text>

              <Text style={styles.orderLabel}>Total</Text>
              <Text style={styles.orderValue}>
                ${incomingOrder?.totalAmount}
              </Text>
            </View>

            <Pressable
              style={styles.acceptButton}
              onPress={() => {
                if (incomingOrder) acceptOrder(incomingOrder.id);
              }}
            >
              <Text style={styles.acceptButtonText}>Accept</Text>
            </Pressable>

            <Pressable
              style={styles.declineButton}
              onPress={() => {
                if (incomingOrder) declineOrder(incomingOrder.id);
              }}
            >
              <Text style={styles.declineButtonText}>Decline</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  },
  content: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 24,
  },
  statusCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 16,
    padding: 20,
    gap: 8,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusLabel: {
    fontSize: 17,
    fontWeight: "600",
  },
  statusSubtext: {
    fontSize: 13,
    color: "#666",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 24,
    marginBottom: 12,
  },
  centeredSmall: {
    paddingVertical: 24,
    alignItems: "center",
  },
  emptySubText: {
    fontSize: 14,
    color: "#999",
    marginBottom: 8,
  },
  pickupCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 12,
    padding: 16,
    gap: 6,
    marginBottom: 12,
  },
  pickupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pickupRestaurant: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
  },
  pickupTotal: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FF6B35",
  },
  pickupAddress: {
    fontSize: 13,
    color: "#666",
  },
  pickupButton: {
    backgroundColor: "#FF6B35",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 6,
  },
  pickupButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  orderDetails: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    gap: 6,
  },
  orderLabel: {
    fontSize: 12,
    color: "#999",
    marginTop: 8,
  },
  orderValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  acceptButton: {
    backgroundColor: "#22C55E",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  acceptButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  declineButton: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  declineButtonText: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "600",
  },
});
