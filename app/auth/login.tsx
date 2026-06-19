import { useAuth } from '@/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
  const router = useRouter();
  const { login, guestLogin, user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF8A80" />
      </View>
    );
  }

  if (user) {
    return <Redirect href="/" />;
  }

  const handleLogin = async () => {
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      router.replace('/');
    } catch (e: any) {
      Alert.alert('ログイン失敗', e.message || 'ログインに失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGuest = async () => {
    setSubmitting(true);
    try {
      await guestLogin();
      router.replace('/');
    } catch (e: any) {
      Alert.alert('ゲストログイン失敗', e.message || 'ゲストログインに失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LinearGradient colors={["#FFF8E1", "#fdd961"]} style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>ログイン</Text>

        <TextInput
          style={styles.input}
          placeholder="メールアドレス"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="パスワード"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>ログイン</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.ghostButton} onPress={handleGuest} disabled={submitting}>
          <Text style={styles.ghostText}>ゲストとしてはじめる</Text>
        </TouchableOpacity>

        <View style={styles.row}>
          <TouchableOpacity onPress={() => router.push('/auth/signup')}>
            <Text style={styles.link}>新規登録はこちら</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/auth/reset-password')}>
            <Text style={styles.link}>パスワードを忘れた方</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { width: '92%', padding: 20, backgroundColor: 'transparent' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  input: { backgroundColor: '#FFF', borderRadius: 12, padding: 12, marginBottom: 12, color: '#222' },
  button: { backgroundColor: '#FF8A80', padding: 14, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#FFF', fontWeight: '700' },
  ghostButton: { marginTop: 12, alignItems: 'center' },
  ghostText: { color: '#333', fontWeight: '600' },
  row: { marginTop: 18, flexDirection: 'row', justifyContent: 'space-between' },
  link: { color: '#1976D2' },
});
