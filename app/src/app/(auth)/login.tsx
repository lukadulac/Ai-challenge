import { useMutation } from "@tanstack/react-query";
import { loginRequestSchema } from "backend/contract";
import { Link } from "expo-router";
import { CalendarCheck } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import { AuthScreen } from "../../auth-screen";
import { describeFailure, type FieldErrors, splitFieldErrors, validate, withoutField } from "../../forms";
import { useApi, useSession } from "../../session";
import { fonts, useTheme } from "../../theme";
import { Banner, Button, PasswordField, Text, TextField } from "../../ui";

const authFields = ["email", "password"];

export default function LoginScreen() {
  const t = useTheme();
  const api = useApi();
  const { signIn } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [failure, setFailure] = useState<string | null>(null);

  const login = useMutation({
    mutationFn: api.login,
    onSuccess: ({ token }) => signIn(token),
    onError: (error) => {
      const { fields, banner } = describeFailure(error, authFields);
      setFieldErrors(fields);
      setFailure(banner);
    },
  });

  const submit = () => {
    const { data, errors } = validate(loginRequestSchema, { email, password });
    const { fields, banner } = splitFieldErrors(errors ?? {}, authFields);
    setFieldErrors(fields);
    setFailure(banner);
    if (data) login.mutate(data);
  };

  return (
    <AuthScreen
      top={
        <View style={{ marginTop: 56, width: 56, height: 56, borderRadius: 16, backgroundColor: t.accent, alignItems: "center", justifyContent: "center" }}>
          <CalendarCheck size={28} color={t.onAccent} />
        </View>
      }
      title="Plan učenja"
      subtitle="Unesi predmet, datum ispita i koliko sati nedeljno imaš. Plan učenja po danima dobijaš odmah."
      footer={
        <Text tone="muted" style={{ fontSize: 15 }}>
          Nemaš nalog?{" "}
          <Link href="/register" style={{ color: t.accent, fontFamily: fonts.semibold }}>
            Registruj se
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
        placeholder="Tvoja lozinka"
        autoComplete="current-password"
        textContentType="password"
        onSubmitEditing={submit}
      />
      <View style={{ marginTop: 8 }}>
        <Button label="Prijavi se" onPress={submit} busy={login.isPending} />
      </View>
    </AuthScreen>
  );
}
