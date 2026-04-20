import { Redirect } from 'expo-router';

export default function Index() {
  // アプリが起動したら、(tabs)グループのindex（ホーム）へ自動転送する
  return <Redirect href="/(tabs)" />;
}