import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Award, Palette, Star, User } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type RewardItem = {
  id: string;
  title: string;
  cost: number;
  Icon: any;
};

const STORAGE_KEY = 'USER_POINTS';

const DUMMY_DATA: RewardItem[] = [
  { id: '1', title: 'ドット絵アイコン（ベーシック）', cost: 50, Icon: User },
  { id: '2', title: 'シルバーメダル（小）', cost: 100, Icon: Star },
  { id: '3', title: 'ゴールドメダル（アニメ付）', cost: 200, Icon: Award },
  { id: '4', title: '限定プレミアムアイコン', cost: 300, Icon: Palette },
];

export default function RewardsScreen() {
  const [points, setPoints] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored != null) {
          setPoints(parseInt(stored, 10));
        } else {
          // 初期ダミー値
          setPoints(120);
          await AsyncStorage.setItem(STORAGE_KEY, String(120));
        }
      } catch (e) {
        console.warn('ポイントの読み込みに失敗しました', e);
        setPoints(120);
      }
    })();
  }, []);

  const savePoints = async (newPoints: number) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, String(newPoints));
      setPoints(newPoints);
    } catch (e) {
      console.warn('ポイントの保存に失敗しました', e);
    }
  };

  const handleExchange = (item: RewardItem) => {
    if (points == null) return;
    if (points < item.cost) {
      Alert.alert('ポイントが足りません', 'このご褒美と交換するにはポイントが不足しています。');
      return;
    }

    Alert.alert('本当に交換しますか？', `${item.title} を ${item.cost} pt で交換しますか？`, [
      { text: 'いいえ', style: 'cancel' },
      {
        text: 'はい',
        onPress: async () => {
          const newPoints = points - item.cost;
          await savePoints(newPoints);
          Alert.alert('交換しました！', `${item.title} と交換しました。`);
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: RewardItem }) => {
    const disabled = (points ?? 0) < item.cost;
    const Icon = item.Icon;

    return (
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <View style={styles.iconCircle}>
            <Icon size={24} color="#FFF" />
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.itemCost}>{item.cost} pt</Text>
        </View>

        <TouchableOpacity
          style={[styles.exchangeButton, disabled && styles.exchangeButtonDisabled]}
          activeOpacity={0.8}
          disabled={disabled}
          onPress={() => handleExchange(item)}
        >
          <Text style={[styles.exchangeButtonText, disabled && styles.exchangeButtonTextDisabled]}>交換する</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <LinearGradient colors={['#FFF8E1', '#fdd961']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.container}>
      <Text style={styles.header}>ご褒美交換</Text>

      <View style={styles.pointsBox}>
        <Text style={styles.pointsText}>🟡 現在のポイント:</Text>
        <Text style={styles.pointsValue}>{points ?? '...' } pt</Text>
      </View>

      <FlatList
        data={DUMMY_DATA}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.columnWrapper}
        numColumns={2}
        showsVerticalScrollIndicator={false}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'left',
  },
  pointsBox: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Platform.select({
      android: { elevation: 3 },
      ios: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
    }),
  },
  pointsText: {
    fontSize: 16,
  },
  pointsValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FF8A00',
  },
  list: {
    paddingBottom: 32,
    paddingTop: 6,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 12,
    flex: 1,
    marginHorizontal: 6,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      android: { elevation: 3 },
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
    }),
  },
  iconWrap: {
    width: 52,
    alignItems: 'center',
  },
  iconCircle: {
    backgroundColor: '#FF8A80',
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    paddingHorizontal: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  itemCost: {
    marginTop: 4,
    fontSize: 13,
    color: '#666',
  },
  exchangeButton: {
    backgroundColor: '#FF8A80',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  exchangeButtonDisabled: {
    backgroundColor: '#CCC',
  },
  exchangeButtonText: {
    color: '#FFF',
    fontWeight: '700',
  },
  exchangeButtonTextDisabled: {
    color: '#666',
  },
});