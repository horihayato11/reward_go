import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/constants/storageKeys';
import type { HistoryEntry } from '@/services/ArrivalTracking/context';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle, XCircle } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const pad = (n: number) => String(n).padStart(2, '0');

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function HistoryScreen() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.MISSION_HISTORY);
      setHistory(raw ? JSON.parse(raw) : []);
      setLoading(false);
    })();
  }, []);

  const successCount = history.filter((h) => h.result === 'success').length;
  const totalPoints = history.reduce((sum, h) => sum + h.earnedPoints, 0);

  if (loading) {
    return (
      <LinearGradient colors={['#FFF8E1', '#fdd961']} style={styles.center}>
        <ActivityIndicator size="large" color="#FF8A80" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#FFF8E1', '#fdd961']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.container}>
      {/* サマリー */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{successCount}</Text>
          <Text style={styles.summaryLabel}>達成</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{history.length - successCount}</Text>
          <Text style={styles.summaryLabel}>失敗</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryValue, { color: '#FF8A00' }]}>{totalPoints}</Text>
          <Text style={styles.summaryLabel}>獲得 pt</Text>
        </View>
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>まだミッション履歴がありません。</Text>
          <Text style={styles.emptySubText}>最初のミッションを達成してみよう！</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={[styles.badge, item.result === 'success' ? styles.badgeSuccess : styles.badgeFail]}>
                {item.result === 'success'
                  ? <CheckCircle size={20} color="#4CAF50" />
                  : <XCircle size={20} color="#F44336" />
                }
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.targetName}</Text>
                <Text style={styles.cardDate}>{formatDate(item.completedAt)}</Text>
                {item.streak > 1 && (
                  <Text style={styles.cardStreak}>🔥 {item.streak}日連続</Text>
                )}
              </View>

              <View style={styles.cardRight}>
                {item.result === 'success' ? (
                  <Text style={styles.pointsText}>+{item.earnedPoints} pt</Text>
                ) : (
                  <Text style={styles.failText}>失敗</Text>
                )}
              </View>
            </View>
          )}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  summaryRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  summaryValue: { fontSize: 22, fontWeight: '800', color: '#333' },
  summaryLabel: { fontSize: 11, color: '#888', marginTop: 2 },

  list: { paddingHorizontal: 16, paddingBottom: 32 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  badgeSuccess: { backgroundColor: '#E8F5E9' },
  badgeFail: { backgroundColor: '#FFEBEE' },

  cardBody: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#222' },
  cardDate: { fontSize: 12, color: '#999', marginTop: 2 },
  cardStreak: { fontSize: 11, color: '#FF8A00', marginTop: 2 },

  cardRight: { marginLeft: 8, alignItems: 'flex-end' },
  pointsText: { fontSize: 16, fontWeight: '800', color: '#4CAF50' },
  failText: { fontSize: 14, fontWeight: '700', color: '#F44336' },

  emptyBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 80 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#999' },
  emptySubText: { fontSize: 13, color: '#BBB', marginTop: 6 },
});
