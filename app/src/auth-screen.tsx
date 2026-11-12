import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "./theme";
import { Text } from "./ui";

/** The shared frame of Login and Register: heading, form, and a footer pinned to the bottom. */
export function AuthScreen({
  top,
  title,
  subtitle,
  children,
  footer,
}: {
  top?: ReactNode;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          gap: 32,
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 24,
        }}
      >
        {top}
        <View style={{ gap: 8 }}>
          <Text accessibilityRole="header" weight="bold" style={{ fontSize: 32, lineHeight: 37, letterSpacing: -0.6 }}>
            {title}
          </Text>
          <Text tone="muted" style={{ lineHeight: 24 }}>
            {subtitle}
          </Text>
        </View>
        <View style={{ gap: 16 }}>{children}</View>
        <View style={{ marginTop: "auto", alignItems: "center" }}>{footer}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
