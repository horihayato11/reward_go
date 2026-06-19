import { useAuth } from '@/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    setLoading(true);
    try {
      await resetPassword(email.trim());
      Alert.alert('送信完了', 'パスワードリセットのメールを送信しました');
      router.back();
    } catch (e: any) {
      Alert.alert('送信失敗', e.message || '送信に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#FFF8E1", "#fdd961"]} style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>パスワードをリセット</Text>

        <TextInput
          style={styles.input}
          placeholder="登録済みのメールアドレス"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TouchableOpacity style={styles.button} onPress={handleReset} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>リセットメールを送信</Text>}
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
  title: { fontSize: 20, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  input: { backgroundColor: '#FFF', borderRadius: 12, padding: 12, marginBottom: 12 },
  button: { backgroundColor: '#FF8A80', padding: 14, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#FFF', fontWeight: '700' },
});
