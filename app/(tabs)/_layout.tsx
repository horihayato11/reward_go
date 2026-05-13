import { Tabs, useRouter } from 'expo-router';
import { Calendar, Gift, Home, MapPin, Settings, User, UserCircle } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

export default function TabLayout() {
  const router = useRouter();
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#FF9800', // 選択時の色（オレンジ）
      tabBarInactiveTintColor: '#999',  // 未選択時の色
      tabBarStyle: {
        borderTopLeftRadius: 20,       // 上の角を丸く
        borderTopRightRadius: 20,
        height: 60,
        paddingBottom: 10,
      },
      headerTitle: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MapPin color="#FF8A80" size={24} style={{ marginRight: 8 }} />
          <Text style={{ fontFamily: 'Fredoka_700Bold', fontSize: 28, color: '#FF8A80', letterSpacing: 1 }}>RewardGo</Text>
        </View>
      ),
    }}>
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/login')}
              style={{
                marginRight: 12,
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#FFF',
                borderWidth: 1,
                borderColor: '#EEE',
              }}
            >
              <UserCircle size={20} color="#333" />
            </TouchableOpacity>
          ),
        }}
      />

      <Tabs.Screen
        name="rewards" // (tabs)/rewards.tsx を作るとここに表示されます
        options={{
          tabBarIcon: ({ color }) => <Gift size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="destination" // (tabs)/destination.tsx を作るとここに表示されます
        options={{
          title: '目的地',
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="profile" // (tabs)/profile.tsx を作るとここに表示されます
        options={{
          title: 'アカウント',
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="schedule" // (tabs)/schedule.tsx を作るとここに表示されます
        options={{
          title: 'スケジュール',
          tabBarIcon: ({ color }) => <Calendar size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="settings" // (tabs)/settings.tsx を作るとここに表示されます
        options={{
          title: '設定',
          tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}