import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import GradientScreen from "@/components/ui/GradientScreen";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { useTheme } from "@/contexts/ThemeContext";
import { radius, spacing } from "@/lib/theme";

export default function PaymentTransaction() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const insets = useSafeAreaInsets();
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const Summary = ({ label, value, color = colors.text }) => (
    <View style={styles.summaryBox}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
    </View>
  );

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, { toValue: 1, duration: 1500, useNativeDriver: true })
    ).start();
  }, []);

  const spin = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await AsyncStorage.getItem("AUTH_TOKEN");
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/payment-history`, {
        method: "GET",
        headers: { "Content-Type": "application/json", token: token },
      });
      if (!response.ok) {
        if (response.status === 404) { setTransactions([]); return; }
        throw new Error("Failed to load payment history");
      }
      const data = await response.json();
      if (Array.isArray(data?.data)) {
        setTransactions(data.data.map((item) => ({
          status: item.isPaid ? "completed" : "pending",
          latestStatus: item.isPaid ? "completed" : "pending",
          amount: item.amount || 0,
          date: item.createdAt,
          fullName: item.fullName,
          phone: item.phone,
          sessionId: item.sessionId,
        })));
      } else {
        setTransactions([]);
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPaymentHistory(); }, []);
  useFocusEffect(useCallback(() => { fetchPaymentHistory(); }, []));

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);

  const formatDate = (date) =>
    new Date(date).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const getStatus = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "success":
        return { icon: "checkmark-circle", color: colors.success, label: "Successful" };
      case "failed":
        return { icon: "close-circle", color: colors.danger, label: "Failed" };
      default:
        return { icon: "time", color: colors.goldText, label: "Pending" };
    }
  };

  const renderBody = () => {
    if (loading) {
      return (
        <View style={styles.center}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Ionicons name="refresh" size={32} color={colors.gold} />
          </Animated.View>
          <Text style={styles.muted}>Loading payment history...</Text>
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.center}>
          <MaterialIcons name="error-outline" size={42} color={colors.danger} />
          <Text style={styles.error}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchPaymentHistory}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <>
        <View style={styles.summary}>
          <Summary label="Total" value={transactions.length} color={colors.text} />
          <Summary label="Successful" value={transactions.filter((t) => t.latestStatus === "completed").length} color={colors.success} />
          <Summary label="Amount" value={formatCurrency(transactions.reduce((sum, t) => sum + (t.amount || 0), 0))} color={colors.goldText} />
        </View>

        {transactions.length === 0 ? (
          <View style={styles.center}>
            <View style={styles.emptyRing}>
              <Ionicons name="card-outline" size={40} color={colors.gold} />
            </View>
            <Text style={styles.emptyTitle}>No payment history</Text>
            <Text style={styles.muted}>Your transactions will appear here.</Text>
          </View>
        ) : (
          <FlatList
            data={transactions}
            keyExtractor={(_, index) => index.toString()}
            contentContainerStyle={{ paddingBottom: insets.bottom + 24, paddingHorizontal: spacing.gutter }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const status = getStatus(item.latestStatus || item.status);
              return (
                <View style={styles.card}>
                  <View style={styles.row}>
                    <Ionicons name={status.icon} size={22} color={status.color} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.cardTitle}>Payment Transaction</Text>
                      <Text style={styles.cardSub}>{formatDate(item.date)}</Text>
                      <Text style={styles.small}>Name — {item.fullName}</Text>
                      <Text style={styles.small}>Phone — {item.phone}</Text>
                    </View>
                    <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
                  </View>
                </View>
              );
            }}
          />
        )}
      </>
    );
  };

  return (
    <GradientScreen>
      <ScreenHeader
        title="Payment Transactions"
        subtitle="View your payment history and transaction details"
      />
      {renderBody()}
    </GradientScreen>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  summary: { flexDirection: "row", marginBottom: 8, paddingHorizontal: spacing.gutter, gap: 10, marginTop: 4 },
  summaryBox: {
    flex: 1, backgroundColor: colors.surface, padding: 14, borderRadius: radius.md,
    alignItems: "center", borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  summaryLabel: { fontSize: 12.5, color: colors.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.4 },
  summaryValue: { fontSize: 18, fontWeight: "800" },

  card: {
    backgroundColor: colors.surface, borderRadius: radius.md, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  row: { flexDirection: "row", alignItems: "center" },
  cardTitle: { fontSize: 14.5, fontWeight: "700", color: colors.text },
  cardSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  amount: { fontSize: 15, fontWeight: "800", color: colors.text },
  small: { fontSize: 11.5, color: colors.textSubtle, marginTop: 4 },

  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32, paddingBottom: 60 },
  emptyRing: {
    width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: colors.goldRing, backgroundColor: "rgba(228,173,13,0.06)", marginBottom: 16,
  },
  emptyTitle: { color: colors.text, fontSize: 17, fontWeight: "700", marginBottom: 4 },
  muted: { marginTop: 4, color: colors.textMuted, textAlign: "center" },
  error: { color: colors.danger, marginTop: 8, textAlign: "center" },
  retryBtn: { marginTop: 16, backgroundColor: colors.goldSoftBg, borderColor: colors.goldSoftBorder, borderWidth: 1, paddingHorizontal: 24, paddingVertical: 11, borderRadius: radius.sm },
  retryText: { color: colors.goldText, fontWeight: "700" },
});
