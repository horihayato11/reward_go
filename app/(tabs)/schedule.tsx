import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Clock, Navigation, Plus, X } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';

type EventItem = {
  id: string;
  title: string;
  start: string; // HH:MM
  end: string; // HH:MM
  location?: string;
};

const STORAGE_KEY = 'SCHEDULE_EVENTS';

const today = new Date();
const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const formatDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const DUMMY_EVENTS: Record<string, EventItem[]> = {
  [formatDate(today)]: [
    { id: 'e1', title: 'BKCキャンパスでプログラミングの授業', start: '10:40', end: '12:10', location: 'BKC' },
    { id: 'e2', title: '中国語の小テスト', start: '13:00', end: '14:30', location: '教室A' },
    { id: 'e3', title: 'アプリ開発サークルのミーティング', start: '18:00', end: '20:00', location: 'オンライン' },
  ],
};

export default function ScheduleScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string>(formatDate(today));
  const [events, setEvents] = useState<Record<string, EventItem[]>>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          setEvents(JSON.parse(raw));
        } else {
          setEvents(DUMMY_EVENTS);
        }
      } catch (e) {
        console.warn(e);
        setEvents(DUMMY_EVENTS);
      }
    })();
  }, []);

  const saveEvents = async (next: Record<string, EventItem[]>) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn('保存失敗', e);
    }
  };

  const markedDates = useMemo(() => {
    const m: Record<string, any> = {};
    Object.keys(events).forEach((d) => {
      m[d] = { marked: true, dots: [{ key: 'e', color: '#FF8A80' }] };
    });
    if (selected) {
      m[selected] = { ...(m[selected] || {}), selected: true, selectedColor: '#FF8A80' };
    }
    return m;
  }, [events, selected]);

  const handleDayPress = (day: DateData) => {
    setSelected(day.dateString);
  };

  const handleAddEvent = async () => {
    if (!title || !start || !end) {
      Alert.alert('入力エラー', 'タイトル・開始時刻・終了時刻を入力してください');
      return;
    }

    const newEvent: EventItem = {
      id: `${Date.now()}`,
      title,
      start,
      end,
      location,
    };

    const next = { ...events };
    next[selected] = next[selected] ? [...next[selected], newEvent] : [newEvent];
    setEvents(next);
    await saveEvents(next);

    setModalVisible(false);
    setTitle('');
    setStart('');
    setEnd('');
    setLocation('');
  };

  const eventsForSelected = events[selected] ?? [];

  const handleSetMission = (item: EventItem) => {
    const hour = item.start.split(':')[0];
    router.push(`/?missionName=${encodeURIComponent(item.title)}&missionHour=${hour}` as any);
  };

  const renderEvent = ({ item }: { item: EventItem }) => (
    <View style={styles.eventCard}>
      <View style={styles.eventLeft}>
        <View style={styles.iconWrap}><Clock size={18} color="#FFF" /></View>
      </View>
      <View style={styles.eventBody}>
        <Text style={styles.eventTitle}>{item.title}</Text>
        <Text style={styles.eventMeta}>{item.start} - {item.end} {item.location ? `· ${item.location}` : ''}</Text>
      </View>
      <TouchableOpacity style={styles.missionBtn} onPress={() => handleSetMission(item)}>
        <Navigation size={13} color="#FF8A80" />
        <Text style={styles.missionBtnText}>ミッション</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <LinearGradient colors={['#FFF8E1', '#fdd961']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.container}>
      <Calendar
        onDayPress={handleDayPress}
        markedDates={markedDates}
        theme={{
          backgroundColor: 'transparent',
          calendarBackground: 'transparent',
          textSectionTitleColor: '#222',
          selectedDayBackgroundColor: '#FF8A80',
          selectedDayTextColor: '#fff',
          todayTextColor: '#FF8A80',
          dayTextColor: '#333',
          arrowColor: '#FF8A80',
        }}
        style={styles.calendar}
      />

      <View style={styles.listWrap}>
        <Text style={styles.listHeader}>予定 — {selected}</Text>
        {eventsForSelected.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>予定はありません。＋ボタンで追加してください。</Text>
          </View>
        ) : (
          <FlatList data={eventsForSelected} keyExtractor={(i) => i.id} renderItem={renderEvent} contentContainerStyle={{ paddingBottom: 120 }} />
        )}
      </View>

      <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={() => setModalVisible(true)}>
        <Plus size={24} color="#FFF" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>予定を追加</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <TextInput placeholder="タイトル" value={title} onChangeText={setTitle} style={styles.input} />
            <TextInput placeholder="開始 (HH:MM)" value={start} onChangeText={setStart} style={styles.input} />
            <TextInput placeholder="終了 (HH:MM)" value={end} onChangeText={setEnd} style={styles.input} />
            <TextInput placeholder="場所 (任意)" value={location} onChangeText={setLocation} style={styles.input} />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={() => setModalVisible(false)}>
                <Text style={styles.btnText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnAdd]} onPress={handleAddEvent}>
                <Text style={[styles.btnText, { color: '#fff' }]}>追加する</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  calendar: { borderRadius: 16, margin: 12 },
  listWrap: { flex: 1, paddingHorizontal: 12 },
  listHeader: { fontSize: 16, fontWeight: '700', marginBottom: 8, marginLeft: 4 },
  emptyBox: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, alignItems: 'center' },
  emptyText: { color: '#666' },
  eventCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    ...Platform.select({ android: { elevation: 2 }, ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } } }),
  },
  eventLeft: { width: 48, alignItems: 'center' },
  iconWrap: { backgroundColor: '#FF8A80', padding: 8, borderRadius: 10 },
  eventBody: { flex: 1, paddingLeft: 8 },
  eventTitle: { fontSize: 15, fontWeight: '700' },
  eventMeta: { marginTop: 6, color: '#666' },
  missionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFF0F0',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  missionBtnText: { fontSize: 11, fontWeight: '700', color: '#FF8A80' },
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 28,
    backgroundColor: '#FF8A80',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({ android: { elevation: 6 }, ios: { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 4 } } }),
  },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' },
  modalContent: { backgroundColor: '#FFF', padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  input: { backgroundColor: 'transparent', padding: 10, borderRadius: 10, marginBottom: 8 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  btn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center', marginHorizontal: 6 },
  btnCancel: { backgroundColor: '#EEE' },
  btnAdd: { backgroundColor: '#FF8A80' },
  btnText: { fontWeight: '700', color: '#333' },
});
