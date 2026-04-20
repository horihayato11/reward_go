import { Tabs } from 'expo-router';
import { Gift, Home, Settings } from 'lucide-react-native';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#FF9800', // 選択時の色（可愛いオレンジ）
      tabBarInactiveTintColor: '#999',  // 未選択時の色
      tabBarStyle: {
        borderTopLeftRadius: 20,       // 上の角を丸くして可愛い感じに
        borderTopRightRadius: 20,
        height: 60,
        paddingBottom: 10,
      },
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'ホーム',
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="rewards" // (tabs)/rewards.tsx を作るとここに表示されます
        options={{
          title: 'ご褒美',
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
          tabBarIcon: ({ color }) => <Gift size={24} color={color} />,
        }}
      />

<Tabs.Screen
        name="schedule" // (tabs)/schedule.tsx を作るとここに表示されます
        options={{
          title: 'スケジュール',
          tabBarIcon: ({ color }) => <Gift size={24} color={color} />,
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