import { useAuth } from '@/contexts/AuthContext';
import { Redirect, Tabs, useRouter } from 'expo-router';
import { Calendar, Gift, Home, MapPin, Settings, User, UserCircle } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

export default function TabLayout() {
  const router = useRouter();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF8A80" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/auth/login" />;
  }
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#FF9800',
      tabBarInactiveTintColor: '#999',
      tabBarStyle: {
        borderTopLeftRadius: 20,
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
              onPress={() => {
                const target = user ? '/account' : '/auth/login';
                router.push(target as any);
              }}
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
        name="rewards"
        options={{
          tabBarIcon: ({ color }) => <Gift size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="destination"
        options={{
          title: '目的地',
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'アカウント',
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="schedule"
        options={{
          title: 'スケジュール',
          tabBarIcon: ({ color }) => <Calendar size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: '設定',
          tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
