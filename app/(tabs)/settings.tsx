import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  AlertTriangle,
  Bell,
  ChevronRight,
  FileText,
  MapPin,
  Trash2
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const [pushEnabled, setPushEnabled] = useState(true);

  const togglePush = (value: boolean) => {
    setPushEnabled(value);
    // ここで通知設定の保存を行う（ダミー）
  };

  const confirmLocationPermission = () => {
    Alert.alert('位置情報の権限確認', '端末の設定から位置情報を常に許可してください。');
  };

  const clearMissionHistory = () => {
    Alert.alert('履歴を削除しますか？', 'ミッション履歴を削除します。よろしいですか？', [
      { text: 'いいえ', style: 'cancel' },
      {
        text: 'はい',
        onPress: async () => {
          try {
            await AsyncStorage.removeItem('MISSIONS');
            Alert.alert('完了', 'ミッション履歴を削除しました。');
          } catch (e) {
            console.warn(e);
            Alert.alert('エラー', '削除に失敗しました。');
          }
        },
      },
    ]);
  };

  const resetAllData = () => {
    Alert.alert(
      'データ初期化の確認',
      '本当にすべてのデータ（ポイント含む）を消去しますか？この操作は元に戻せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除する',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert('完了', 'すべてのデータを初期化しました。');
            } catch (e) {
              console.warn(e);
              Alert.alert('エラー', 'データの初期化に失敗しました。');
            }
          },
        },
      ]
    );
  };

  return (
    <LinearGradient colors={['#FFF8E1', '#fdd961']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.container}>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.groupLabel}>アプリの設定</Text>
        <View style={styles.groupBox}>
          <View style={styles.itemRow}>
            <View style={styles.itemLeft}>
              <View style={styles.iconCircleSmall}><Bell size={16} color="#FFF" /></View>
              <Text style={styles.itemLabel}>プッシュ通知</Text>
            </View>
            <Switch value={pushEnabled} onValueChange={togglePush} />
          </View>

          <TouchableOpacity style={styles.itemRow} onPress={confirmLocationPermission} activeOpacity={0.7}>
            <View style={styles.itemLeft}>
              <View style={styles.iconCircleSmall}><MapPin size={16} color="#FFF" /></View>
              <Text style={styles.itemLabel}>位置情報の権限確認</Text>
            </View>
            <ChevronRight size={20} color="#999" />
          </TouchableOpacity>
        </View>

        <Text style={styles.groupLabel}>データの管理</Text>
        <View style={styles.groupBox}>
          <TouchableOpacity style={styles.itemRow} onPress={clearMissionHistory} activeOpacity={0.7}>
            <View style={styles.itemLeft}>
              <View style={styles.iconCircleSmallAlt}><Trash2 size={16} color="#FFF" /></View>
              <Text style={styles.itemLabel}>ミッション履歴のクリア</Text>
            </View>
            <ChevronRight size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.itemRow} onPress={resetAllData} activeOpacity={0.7}>
            <View style={styles.itemLeft}>
              <View style={styles.iconCircleSmallWarn}><AlertTriangle size={16} color="#FFF" /></View>
              <Text style={[styles.itemLabel, styles.dangerText]}>全データの初期化</Text>
            </View>
            <Text style={[styles.itemMeta, styles.dangerText]}>削除</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.groupLabel}>アプリについて</Text>
        <View style={styles.groupBox}>
          <TouchableOpacity style={styles.itemRow} activeOpacity={0.7} onPress={() => Alert.alert('利用規約', '利用規約を表示します（ダミー）')}>
            <View style={styles.itemLeft}>
              <View style={styles.iconCircleSmall}><FileText size={16} color="#FFF" /></View>
              <Text style={styles.itemLabel}>利用規約</Text>
            </View>
            <ChevronRight size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.itemRow} activeOpacity={0.7} onPress={() => Alert.alert('プライバシーポリシー', 'プライバシーポリシーを表示します（ダミー）')}>
            <View style={styles.itemLeft}>
              <View style={styles.iconCircleSmall}><FileText size={16} color="#FFF" /></View>
              <Text style={styles.itemLabel}>プライバシーポリシー</Text>
            </View>
            <ChevronRight size={20} color="#999" />
          </TouchableOpacity>

          <View style={styles.itemRow}>
            <View style={styles.itemLeft}>
              <View style={styles.iconCircleSmall}><FileText size={16} color="#FFF" /></View>
              <Text style={styles.itemLabel}>バージョン</Text>
            </View>
            <Text style={styles.itemMeta}>1.0.0</Text>
          </View>
        </View>

      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  backButton: {
    marginRight: 8,
    padding: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
  },
  scroll: {
    padding: 16,
    paddingBottom: 48,
  },
  groupLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
    marginTop: 6,
  },
  groupBox: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 12,
    ...Platform.select({
      android: { elevation: 2 },
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
    }),
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircleSmall: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FF8A80',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconCircleSmallAlt: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#8AAEFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconCircleSmallWarn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemLabel: {
    fontSize: 16,
    color: '#222',
  },
  itemMeta: {
    fontSize: 14,
    color: '#666',
  },
  dangerText: {
    color: '#FF3B30',
    fontWeight: '600',
  },
});
