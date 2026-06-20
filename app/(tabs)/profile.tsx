import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/constants/storageKeys';
import { useAuth } from '@/contexts/AuthContext';
import { useArrivalTracking } from '@/services/ArrivalTracking/context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Bell, ChevronRight, LogOut, Settings, Trophy, User } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

type MenuItem = {
  key: string;
  label: string;
  Icon: React.ComponentType<any>;
  onPress?: () => void;
  danger?: boolean;
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { streakCount } = useArrivalTracking();

  const [points, setPoints] = useState(0);
  const [missionsCount, setMissionsCount] = useState(0);

  const loadStats = useCallback(async () => {
    try {
      const [p, m] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.POINTS),
        AsyncStorage.getItem(STORAGE_KEYS.MISSIONS_COUNT),
      ]);
      if (p != null) setPoints(Number(p));
      if (m != null) setMissionsCount(Number(m));
    } catch {
      // 読み込み失敗は無視
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  const handleSignOut = async () => {
    Alert.alert('ログアウト', 'ログアウトしますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: 'ログアウト',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            router.replace('/auth/login' as any);
          } catch (e: any) {
            Alert.alert('エラー', e.message || 'ログアウトに失敗しました');
          }
        },
      },
    ]);
  };

  const handleReset = () => {
    Alert.alert('データを初期化しますか？', 'この操作は元に戻せません。', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '初期化',
        style: 'destructive',
        onPress: async () => {
          try {
            await Promise.all([
              AsyncStorage.removeItem(STORAGE_KEYS.POINTS),
              AsyncStorage.removeItem(STORAGE_KEYS.MISSIONS_COUNT),
              AsyncStorage.removeItem(STORAGE_KEYS.STREAK_COUNT),
              AsyncStorage.removeItem(STORAGE_KEYS.STREAK_LAST_DATE),
            ]);
            setPoints(0);
            setMissionsCount(0);
            Alert.alert('完了', 'データを初期化しました。');
          } catch {
            Alert.alert('エラー', '初期化に失敗しました。');
          }
        },
      },
    ]);
  };

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'ゲストユーザー';

  const streakLabel =
    streakCount >= 30 ? '🏆 30日連続！'
    : streakCount >= 7  ? '🥇 7日連続！'
    : streakCount >= 3  ? '🥈 3日連続！'
    : streakCount > 0   ? `🔥 ${streakCount}日連続`
    : '—';

  const menu: MenuItem[] = [
    { key: 'account', label: 'アカウント設定', Icon: Settings, onPress: () => router.push('/account' as any) },
    { key: 'notifications', label: '通知設定', Icon: Bell, onPress: () => router.push('/settings/notifications' as any) },
    { key: 'history', label: 'ミッション履歴', Icon: Trophy, onPress: () => router.push('/history' as any) },
    { key: 'signout', label: 'ログアウト', Icon: LogOut, onPress: handleSignOut, danger: true },
  ];

  return (
    <LinearGradient
      colors={['#FFF8E1', '#fdd961']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.bg}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>プロフィール</Text>

        {/* アバター */}
        <View style={styles.profileArea}>
          <View style={styles.avatarCircle}>
            <User size={52} color="#fff" />
          </View>
          <Text style={styles.username}>{displayName}</Text>
          {user?.email && <Text style={styles.email}>{user.email}</Text>}
        </View>

        {/* ステータスカード */}
        <View style={styles.statsCard}>
          <View style={styles.statColumn}>
            <Text style={styles.statValue}>{points}</Text>
            <Text style={styles.statLabel}>累計ポイント</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statColumn}>
            <Text style={styles.statValue}>{missionsCount}</Text>
            <Text style={styles.statLabel}>達成ミッション</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statColumn}>
            <Text style={[styles.statValue, styles.streakValue]}>{streakCount}</Text>
            <Text style={styles.statLabel}>連続日数</Text>
          </View>
        </View>

        {/* ストリークバッジ */}
        {streakCount > 0 && (
          <View style={styles.streakBadge}>
            <Text style={styles.streakBadgeText}>{streakLabel}</Text>
            {streakCount > 0 && (
              <Text style={styles.streakNextHint}>
                {streakCount < 3
                  ? `あと ${3 - streakCount} 日で3日連続ボーナス！`
                  : streakCount < 7
                  ? `あと ${7 - streakCount} 日で7日連続ボーナス！`
                  : streakCount < 30
                  ? `あと ${30 - streakCount} 日で30日連続ボーナス！`
                  : '最大連続ボーナス達成中！'}
              </Text>
            )}
          </View>
        )}

        {/* メニュー */}
        <View style={styles.menuList}>
          {menu.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={styles.menuItem}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuLeft}>
                <item.Icon size={20} color={item.danger ? '#FF5252' : '#333'} />
                <Text style={[styles.menuLabel, item.danger && { color: '#FF5252' }]}>
                  {item.label}
                </Text>
              </View>
              <ChevronRight size={20} color="#999" />
            </TouchableOpacity>
          ))}
        </View>

        {/* データ初期化（テキストリンク） */}
        <TouchableOpacity onPress={handleReset} style={styles.resetLink}>
          <Text style={styles.resetLinkText}>データを初期化する</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: { padding: 20, paddingBottom: 48 },
  header: { fontSize: 20, fontWeight: '700', marginBottom: 18 },

  profileArea: { alignItems: 'center', marginBottom: 20 },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FF8A80',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  username: { fontSize: 18, fontWeight: '700' },
  email: { fontSize: 13, color: '#888', marginTop: 2 },

  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    marginBottom: 14,
  },
  statColumn: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 40, backgroundColor: '#EEE' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 4, textAlign: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: '#333' },
  streakValue: { color: '#FF8A00' },

  streakBadge: {
    backgroundColor: '#FFF3E0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD54F',
  },
  streakBadgeText: { fontSize: 16, fontWeight: '700', color: '#E65100' },
  streakNextHint: { fontSize: 12, color: '#BF360C', marginTop: 4 },

  menuList: { gap: 10 },
  menuItem: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuLabel: { fontSize: 15, fontWeight: '600', color: '#333' },

  resetLink: { marginTop: 24, alignItems: 'center' },
  resetLinkText: { fontSize: 13, color: '#BDBDBD' },
});
