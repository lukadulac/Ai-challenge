import { useMutation } from "@tanstack/react-query";
import { registerRequestSchema } from "backend/contract";
import { Link, router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { ApiError } from "../../api";
import { AuthScreen } from "../../auth-screen";
import { describeFailure, type FieldErrors, splitFieldErrors, validate, withoutField } from "../../forms";
import { useApi, useSession } from "../../session";
import { fonts, useTheme } from "../../theme";
import { Banner, Button, PasswordField, Text, TextField } from "../../ui";

const authFields = ["email", "password"];

export default function RegisterScreen() {
  const t = useTheme();
  const api = useApi();
  const { signIn } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [failure, setFailure] = useState<string | null>(null);

  const register = useMutation({
    mutationFn: api.register,
    onSuccess: ({ token }) => signIn(token),
    onError: (error) => {
      if (error instanceof ApiError && error.code === "email_taken") return setFieldErrors({ email: error.message });
      const { fields, banner } = describeFailure(error, authFields);
      setFieldErrors(fields);
      setFailure(banner);
    },
  });

  const submit = () => {
    const { data, errors } = validate(registerRequestSchema, { email, password });
    const { fields, banner } = splitFieldErrors(errors ?? {}, authFields);
    setFieldErrors(fields);
    setFailure(banner);
    if (data) register.mutate(data);
  };

  return (
    <AuthScreen
      top={
        <View style={{ height: 44, marginLeft: -10, flexDirection: "row" }}>
          <Pressable
            accessibilityRole="button"
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/login"))}
            style={{ minHeight: 44, flexDirection: "row", alignItems: "center", gap: 2, paddingHorizontal: 6 }}
          >
            <ChevronLeft size={24} color={t.accent} strokeWidth={2.25} />
            <Text tone="accent" style={{ fontSize: 17 }}>
              Prijava
            </Text>
          </Pressable>
        </View>
      }
      title="Napravi nalog"
      subtitle="Planovi se čuvaju na tvom nalogu, pa ih uvek imaš kad se prijaviš."
      footer={
        <Text tone="muted" style={{ fontSize: 15 }}>
          Već imaš nalog?{" "}
          <Link href="/login" replace style={{ color: t.accent, fontFamily: fonts.semibold }}>
            Prijavi se
          </Link>
        </Text>
      }
    >
      {failure && <Banner message={failure} />}
      <TextField
        label="Email"
        value={email}
        onChangeText={(value) => {
          setEmail(value);
          setFieldErrors((errors) => withoutField(errors, "email"));
        }}
        error={fieldErrors.email}
        placeholder="ime@primer.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
      />
      <PasswordField
        label="Lozinka"
        value={password}
        onChangeText={(value) => {
          setPassword(value);
          setFieldErrors((errors) => withoutField(errors, "password"));
        }}
        error={fieldErrors.password}
        hint="Najmanje 8 znakova."
        placeholder="Najmanje 8 znakova"
        autoComplete="new-password"
        textContentType="newPassword"
        onSubmitEditing={submit}
      />
      <View style={{ marginTop: 8 }}>
        <Button label="Registruj se" onPress={submit} busy={register.isPending} />
      </View>
    </AuthScreen>
  );
}
