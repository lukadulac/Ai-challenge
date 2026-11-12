import type { PlanSummary } from "backend/contract";
import { router } from "expo-router";
import { Calendar, LogOut, Plus } from "lucide-react-native";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { activitiesCount, daysLeftLabel, formatDate, localToday, percent, weekday } from "../../format";
import { usePlans } from "../../plans";
import { useSession } from "../../session";
import { useTheme } from "../../theme";
import { Banner, BottomBar, Button, styles, Text } from "../../ui";

export default function MyPlansScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { signOut } = useSession();
  const plans = usePlans();
  const today = localToday();
  const upcoming = plans.data?.filter((plan) => plan.examDate >= today) ?? [];
  const past = plans.data?.filter((plan) => plan.examDate < today) ?? [];
  const isEmpty = plans.data?.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top, paddingHorizontal: 20, paddingBottom: 140, gap: 20, flexGrow: 1 }}>
        <View style={{ height: 44, flexDirection: "row", justifyContent: "flex-end", marginRight: -8 }}>
          <Pressable
            accessibilityRole="button"
            onPress={() => void signOut()}
            style={{ minHeight: 44, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 8 }}
          >
            <LogOut size={20} color={t.accent} />
            <Text tone="accent" weight="medium">
              Odjavi se
            </Text>
          </Pressable>
        </View>

        <View style={{ gap: 4 }}>
          <Text tone="muted" weight="semibold" style={{ fontSize: 14 }}>
            {weekday(today)}, {formatDate(today)}
          </Text>
          <Text accessibilityRole="header" weight="bold" style={{ fontSize: 32, lineHeight: 37, letterSpacing: -0.6 }}>
            Moji planovi
          </Text>
        </View>

        {plans.isPending && <ActivityIndicator color={t.accent} style={{ marginTop: 40 }} />}
        {plans.isError && (
          <View style={{ gap: 12 }}>
            <Banner message={plans.error.message} />
            <Button label="Pokušaj ponovo" onPress={() => void plans.refetch()} busy={plans.isFetching} />
          </View>
        )}
        {isEmpty && <EmptyState />}

        {upcoming.length > 0 && (
          <View style={{ gap: 12 }}>
            {upcoming.map((plan) => (
              <PlanCard key={plan.id} plan={plan} today={today} />
            ))}
          </View>
        )}
        {past.length > 0 && (
          <View style={{ gap: 12 }}>
            <Text accessibilityRole="header" tone="muted" weight="semibold" style={{ fontSize: 13, letterSpacing: 0.5, textTransform: "uppercase", marginTop: 12 }}>
              Prošli ispiti
            </Text>
            {past.map((plan) => (
              <PlanCard key={plan.id} plan={plan} today={today} />
            ))}
          </View>
        )}
      </ScrollView>

      <BottomBar>
        <Button label={isEmpty ? "Napravi prvi plan" : "Novi plan"} icon={Plus} onPress={() => router.push("/new")} />
      </BottomBar>
    </View>
  );
}

function EmptyState() {
  const t = useTheme();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16, paddingHorizontal: 12, paddingBottom: 80 }}>
      <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: t.accentSoft, alignItems: "center", justifyContent: "center" }}>
        <Calendar size={32} color={t.accent} />
      </View>
      <Text weight="bold" style={{ fontSize: 20, textAlign: "center" }}>
        Nemaš još nijedan plan
      </Text>
      <Text tone="muted" style={{ textAlign: "center", lineHeight: 24 }}>
        Unesi predmet, datum ispita i koliko sati nedeljno imaš, a aplikacija će ti predložiti raspored učenja.
      </Text>
    </View>
  );
}

function PlanCard({ plan, today }: { plan: PlanSummary; today: string }) {
  const t = useTheme();
  const { completedActivities, totalActivities } = plan.progress;
  const done = percent(completedActivities, totalActivities);
  const passed = plan.examDate < today;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/plans/${plan.id}`)}
      style={({ pressed }) => [styles.card, { gap: 14, padding: 16, backgroundColor: t.surface, borderColor: t.border, opacity: pressed ? 0.8 : 1 }]}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text weight="semibold" style={{ fontSize: 17, lineHeight: 22 }}>
            {plan.subject}
          </Text>
          <Text tone="muted" style={{ fontSize: 14 }}>
            Ispit {formatDate(plan.examDate)}
          </Text>
        </View>
        <View style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, backgroundColor: passed ? t.neutralSoft : t.accentSoft }}>
          <Text weight="semibold" style={{ fontSize: 13, color: passed ? t.muted : t.accent }}>
            {daysLeftLabel(today, plan.examDate)}
          </Text>
        </View>
      </View>
      <View style={{ gap: 8 }}>
        <View style={{ height: 8, borderRadius: 999, backgroundColor: t.track, overflow: "hidden" }}>
          <View style={{ height: "100%", width: `${done}%`, borderRadius: 999, backgroundColor: done === 100 ? t.successFill : t.accent }} />
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text tone="muted" style={{ fontSize: 13 }}>
            {completedActivities}/{activitiesCount(totalActivities)}
          </Text>
          <Text weight="semibold" style={{ fontSize: 13 }}>
            {done}%
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
