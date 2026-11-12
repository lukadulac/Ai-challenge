import { Stack } from "expo-router";
import { useTheme } from "../../theme";

export const unstable_settings = { anchor: "login" };

export default function AuthLayout() {
  const t = useTheme();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.bg } }} />;
}
