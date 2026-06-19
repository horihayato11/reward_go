import { useAuth } from '@/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function SignupScreen() {
  const router = useRouter();
  const { signup, user, loading } = useAuth();
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

  const handleSignup = async () => {
    setSubmitting(true);
    try {
      await signup(email.trim(), password);
      Alert.alert('登録完了', 'アカウントが作成されました');
      router.replace('/');
    } catch (e: any) {
      Alert.alert('登録失敗', e.message || '登録に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LinearGradient colors={["#FFF8E1", "#fdd961"]} style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>新規登録</Text>

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

        <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>登録する</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={{ marginTop: 12 }} onPress={() => router.back()}>
          <Text style={{ textAlign: 'center', color: '#1976D2' }}>戻る</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { width: '92%', padding: 20, backgroundColor: 'transparent' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  input: { backgroundColor: '#FFF', borderRadius: 12, padding: 12, marginBottom: 12 },
  button: { backgroundColor: '#FF8A80', padding: 14, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#FFF', fontWeight: '700' },
});
