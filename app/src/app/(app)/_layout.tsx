import { Stack } from "expo-router";
import { useTheme } from "../../theme";

export default function SignedInLayout() {
  const t = useTheme();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.bg } }} />;
}
