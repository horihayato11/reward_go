import { useAuth } from '@/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function AccountScreen() {
  const router = useRouter();
  const { user, updateProfile, updateEmail, updatePassword, signOut, deleteAccount } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [newEmail, setNewEmail] = useState(user?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setDisplayName(user?.displayName || '');
    setPhotoURL(user?.photoURL || '');
    setNewEmail(user?.email || '');
  }, [user]);

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      await updateProfile({ displayName: displayName || undefined, photoURL: photoURL || undefined });
      Alert.alert('更新完了', 'プロフィール情報を更新しました');
    } catch (e: any) {
      Alert.alert('更新失敗', e.message || 'プロフィールの更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmail = async () => {
    setLoading(true);
    try {
      await updateEmail(newEmail.trim());
      Alert.alert('更新完了', 'メールアドレスを更新しました');
    } catch (e: any) {
      Alert.alert('更新失敗', e.message || 'メールアドレスの更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword) {
      Alert.alert('入力エラー', '新しいパスワードを入力してください');
      return;
    }
    setLoading(true);
    try {
      await updatePassword(newPassword);
      Alert.alert('更新完了', 'パスワードを更新しました');
      setNewPassword('');
    } catch (e: any) {
      Alert.alert('更新失敗', e.message || 'パスワードの更新に失敗しました。再ログインが必要な場合があります。');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/auth/login' as any);
    } catch (e: any) {
      Alert.alert('ログアウト失敗', e.message || 'ログアウトに失敗しました');
    }
  };

  const handleDelete = () => {
    Alert.alert('アカウント削除', '本当にアカウントを削除しますか？この操作は取り消せません。', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除する',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAccount();
            router.replace('/auth/signup' as any);
          } catch (e: any) {
            Alert.alert('削除失敗', e.message || 'アカウントの削除に失敗しました。再ログインが必要な場合があります。');
          }
        },
      },
    ]);
  };

  return (
    <LinearGradient colors={["#FFF8E1", "#fdd961"]} style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.heading}>アカウント設定</Text>

        <Text style={styles.label}>表示名</Text>
        <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} placeholder="表示名" />

        <Text style={styles.label}>アイコン画像のURL</Text>
        <TextInput style={styles.input} value={photoURL} onChangeText={setPhotoURL} placeholder="https://..." />

        <TouchableOpacity style={styles.button} onPress={handleUpdateProfile} disabled={loading}>
          <Text style={styles.buttonText}>プロフィールを更新</Text>
        </TouchableOpacity>

        <View style={{ height: 1, backgroundColor: '#EEE', marginVertical: 12 }} />

        <Text style={styles.label}>メールアドレス</Text>
        <TextInput style={styles.input} value={newEmail} onChangeText={setNewEmail} keyboardType="email-address" autoCapitalize="none" />
        <TouchableOpacity style={styles.button} onPress={handleUpdateEmail} disabled={loading}>
          <Text style={styles.buttonText}>メールアドレスを更新</Text>
        </TouchableOpacity>

        <View style={{ height: 1, backgroundColor: '#EEE', marginVertical: 12 }} />

        <Text style={styles.label}>パスワード変更</Text>
        <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholder="新しいパスワード" />
        <TouchableOpacity style={styles.button} onPress={handleUpdatePassword} disabled={loading}>
          <Text style={styles.buttonText}>パスワードを更新</Text>
        </TouchableOpacity>

        <View style={{ height: 1, backgroundColor: '#EEE', marginVertical: 12 }} />

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>ログアウト</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteText}>アカウントを削除</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingTop: 24 },
  card: { width: '94%', padding: 16 },
  heading: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  label: { fontSize: 14, color: '#444', marginBottom: 6, marginTop: 8 },
  input: { backgroundColor: '#FFF', borderRadius: 12, padding: 12, marginBottom: 8 },
  button: { backgroundColor: '#FF8A80', padding: 12, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#FFF', fontWeight: '700' },
  signOutButton: { backgroundColor: '#FFF', padding: 12, borderRadius: 12, alignItems: 'center', marginTop: 12, borderWidth: 1, borderColor: '#EEE' },
  signOutText: { color: '#333', fontWeight: '700' },
  deleteButton: { padding: 12, alignItems: 'center', marginTop: 12 },
  deleteText: { color: '#D32F2F', fontWeight: '700' },
});
