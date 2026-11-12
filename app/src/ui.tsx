import { CircleExclamationPoint, Eye, EyeOff, type LucideIcon } from "lucide-react-native";
import { type ReactNode, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text as RNText,
  StyleSheet,
  TextInput,
  type TextInputProps,
  type TextProps,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fonts, useTheme } from "./theme";

type Tone = "muted" | "accent" | "danger" | "success";

export function Text({
  weight = "regular",
  tone,
  style,
  ...props
}: TextProps & { weight?: keyof typeof fonts; tone?: Tone }) {
  const t = useTheme();
  return <RNText {...props} style={[{ fontFamily: fonts[weight], fontSize: 16, color: tone ? t[tone] : t.text }, style]} />;
}

export function Button({
  label,
  onPress,
  busy = false,
  icon: Icon,
}: {
  label: string;
  onPress: () => void;
  busy?: boolean;
  icon?: LucideIcon;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy, disabled: busy }}
      disabled={busy}
      onPress={onPress}
      style={({ pressed }) => [styles.button, { backgroundColor: t.accent, opacity: pressed ? 0.85 : 1 }]}
    >
      {busy ? (
        <ActivityIndicator color={t.onAccent} />
      ) : (
        <>
          {Icon && <Icon size={20} color={t.onAccent} strokeWidth={2.25} />}
          <Text weight="semibold" style={{ color: t.onAccent, fontSize: 17 }}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

export function TextField({
  label,
  error,
  hint,
  trailing,
  style,
  ...input
}: TextInputProps & { label: string; error?: string; hint?: string; trailing?: ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ gap: 8 }}>
      <Text weight="semibold" style={{ fontSize: 14 }}>
        {label}
      </Text>
      <View style={{ justifyContent: "center" }}>
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={t.placeholder}
          style={[
            styles.input,
            {
              borderColor: error ? t.danger : t.border,
              borderWidth: error ? 1.5 : 1,
              backgroundColor: t.surface,
              color: t.text,
              paddingRight: trailing ? 56 : 16,
            },
            style,
          ]}
          {...input}
        />
        {trailing && <View style={styles.trailing}>{trailing}</View>}
      </View>
      {error ? (
        <FieldError message={error} />
      ) : hint ? (
        <Text tone="muted" style={{ fontSize: 14 }}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

export function PasswordField(props: Omit<TextInputProps, "secureTextEntry"> & { label: string; error?: string; hint?: string }) {
  const t = useTheme();
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;
  return (
    <TextField
      {...props}
      secureTextEntry={!visible}
      autoCapitalize="none"
      autoCorrect={false}
      trailing={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={visible ? "Sakrij lozinku" : "Prikaži lozinku"}
          onPress={() => setVisible(!visible)}
          hitSlop={4}
          style={styles.iconButton}
        >
          <Icon size={22} color={t.muted} />
        </Pressable>
      }
    />
  );
}

export function FieldError({ message }: { message: string }) {
  const t = useTheme();
  return (
    <View accessibilityLiveRegion="polite" style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <CircleExclamationPoint size={16} color={t.danger} />
      <Text tone="danger" style={{ fontSize: 14, flexShrink: 1 }}>
        {message}
      </Text>
    </View>
  );
}

export function Banner({ message }: { message: string }) {
  const t = useTheme();
  return (
    <View accessible accessibilityRole="alert" style={[styles.banner, { backgroundColor: t.dangerSoft }]}>
      <CircleExclamationPoint size={20} color={t.danger} />
      <Text tone="danger" weight="medium" style={{ fontSize: 15, flexShrink: 1 }}>
        {message}
      </Text>
    </View>
  );
}

/** The fixed strip at the bottom of a screen that holds its main action. */
export function BottomBar({ children }: { children: ReactNode }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.bottomBar,
        { backgroundColor: t.bg, borderTopColor: t.border, paddingBottom: Math.max(insets.bottom, 12) + 8 },
      ]}
    >
      {children}
    </View>
  );
}

export const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  input: {
    height: 52,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontFamily: fonts.regular,
    fontSize: 16,
  },
  trailing: { position: "absolute", right: 4 },
  iconButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  banner: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12 },
  bottomBar: { position: "absolute", left: 0, right: 0, bottom: 0, paddingTop: 12, paddingHorizontal: 20, borderTopWidth: 1 },
  card: { borderRadius: 16, borderWidth: 1 },
});
