import type { Activity, PlanDetail } from "backend/contract";
import { router, useLocalSearchParams } from "expo-router";
import { Calendar, Check, ChevronLeft, CircleExclamationPoint, Trash } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { activityTypes } from "../../../activity-type";
import {
  activitiesWord,
  daysLeft,
  formatDate,
  formatHours,
  formatShortDate,
  hoursNumber,
  localToday,
  percent,
  weekdayShort,
} from "../../../format";
import { useDeletePlan, usePlan, useSetActivityCompleted } from "../../../plans";
import { useTheme } from "../../../theme";
import { Banner, Button, styles, Text } from "../../../ui";

const goBack = () => (router.canGoBack() ? router.back() : router.replace("/"));

export default function StudyPlanScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const plan = usePlan(id);
  const setCompleted = useSetActivityCompleted(id);
  const deletePlan = useDeletePlan(id, goBack);
  const [failure, setFailure] = useState<string | null>(null);
  const today = localToday();

  const toggle = (activity: Activity) => {
    setFailure(null);
    setCompleted.mutate(
      { activityId: activity.id, completed: !activity.completed },
      { onError: () => setFailure("Promena nije sačuvana. Pokušaj ponovo.") },
    );
  };

  const confirmDelete = (subject: string) =>
    Alert.alert("Obrisati plan?", `„${subject}“ i sve njegove aktivnosti biće trajno obrisani.`, [
      { text: "Otkaži", style: "cancel" },
      {
        text: "Obriši",
        style: "destructive",
        onPress: () => deletePlan.mutate(undefined, { onError: (error) => setFailure(error.message) }),
      },
    ]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ paddingTop: insets.top, paddingHorizontal: 20, paddingBottom: insets.bottom + 32, gap: 20 }}>
      <View style={{ height: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginLeft: -10, marginRight: -8 }}>
        <Pressable accessibilityRole="button" onPress={goBack} style={{ minHeight: 44, flexDirection: "row", alignItems: "center", gap: 2, paddingHorizontal: 6 }}>
          <ChevronLeft size={24} color={t.accent} strokeWidth={2.25} />
          <Text tone="accent" style={{ fontSize: 17 }}>
            Moji planovi
          </Text>
        </Pressable>
        {plan.data && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Obriši plan"
            disabled={deletePlan.isPending}
            onPress={() => confirmDelete(plan.data.subject)}
            style={styles.iconButton}
          >
            {deletePlan.isPending ? <ActivityIndicator color={t.danger} /> : <Trash size={22} color={t.danger} />}
          </Pressable>
        )}
      </View>

      {failure && <Banner message={failure} />}
      {plan.isPending && <ActivityIndicator color={t.accent} style={{ marginTop: 40 }} />}
      {plan.isError && (
        <View style={{ gap: 12 }}>
          <Banner message={plan.error.message} />
          <Button label="Pokušaj ponovo" onPress={() => void plan.refetch()} busy={plan.isFetching} />
        </View>
      )}
      {plan.data && <PlanContent plan={plan.data} today={today} onToggle={toggle} />}
    </ScrollView>
  );
}

function PlanContent({ plan, today, onToggle }: { plan: PlanDetail; today: string; onToggle: (activity: Activity) => void }) {
  const t = useTheme();
  const { completedActivities, totalActivities, completedMinutes, totalMinutes } = plan.progress;
  const done = percent(completedActivities, totalActivities);

  return (
    <>
      <View style={{ gap: 6 }}>
        <Text accessibilityRole="header" weight="bold" style={{ fontSize: 30, lineHeight: 35, letterSpacing: -0.6 }}>
          {plan.subject}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Calendar size={16} color={t.muted} />
          <Text tone="muted" style={{ fontSize: 15 }}>
            Ispit {formatDate(plan.examDate)} · {daysLeft(today, plan.examDate)}
          </Text>
        </View>
      </View>

      <View accessible accessibilityLabel={`Napredak: ${completedActivities} od ${totalActivities} aktivnosti, ${hoursNumber(completedMinutes)} od ${formatHours(totalMinutes)}`} style={[styles.card, { gap: 12, padding: 16, backgroundColor: t.surface, borderColor: t.border }]}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text tone="muted" weight="semibold" style={{ fontSize: 13, letterSpacing: 0.5, textTransform: "uppercase" }}>
            Napredak
          </Text>
          <Text weight="semibold" style={{ fontSize: 15 }}>
            {done}%
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
          <Text weight="bold" style={{ fontSize: 28, letterSpacing: -0.5 }}>
            {completedActivities}/{totalActivities}
          </Text>
          <Text tone="muted" style={{ fontSize: 15 }}>
            {activitiesWord(totalActivities)} · {hoursNumber(completedMinutes)} od {formatHours(totalMinutes)}
          </Text>
        </View>
        <View style={{ height: 8, borderRadius: 999, backgroundColor: t.track, overflow: "hidden" }}>
          <View style={{ height: "100%", width: `${done}%`, borderRadius: 999, backgroundColor: t.accent }} />
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <Text accessibilityRole="header" weight="semibold" style={{ fontSize: 17, marginTop: 4 }}>
          Aktivnosti
        </Text>
        {plan.activities.map((activity) => (
          <ActivityRow key={activity.id} activity={activity} today={today} onToggle={() => onToggle(activity)} />
        ))}
      </View>
    </>
  );
}

function ActivityRow({ activity, today, onToggle }: { activity: Activity; today: string; onToggle: () => void }) {
  const t = useTheme();
  const { label, icon: Icon } = activityTypes[activity.type];
  const isToday = !activity.completed && activity.date === today;
  const isMissed = !activity.completed && activity.date < today;
  const dateLabel = `${weekdayShort(activity.date)}, ${formatShortDate(activity.date)}`;
  const status = activity.completed ? "završeno" : isToday ? "danas" : isMissed ? "propušteno" : undefined;
  const circleColor = isMissed ? t.danger : isToday ? t.accent : t.idleCircle;

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: activity.completed }}
      accessibilityLabel={[label, dateLabel, formatHours(activity.durationMinutes), status].filter(Boolean).join(", ")}
      onPress={onToggle}
      style={({ pressed }) => [
        styles.card,
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
          paddingVertical: 12,
          paddingLeft: 12,
          paddingRight: 16,
          backgroundColor: isToday ? t.accentSoft : t.surface,
          borderColor: isToday ? t.accent : t.border,
          borderWidth: isToday ? 1.5 : 1,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: activity.completed ? t.successFill : "transparent",
            borderWidth: activity.completed ? 0 : 2,
            borderColor: circleColor,
          }}
        >
          {activity.completed && <Check size={16} color={t.onSuccess} strokeWidth={3} />}
        </View>
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Icon size={18} color={t.accent} />
          <Text weight="semibold">{label}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text tone="muted" style={{ fontSize: 14 }}>
            {dateLabel}
          </Text>
          {isToday && (
            <View style={{ paddingVertical: 2, paddingHorizontal: 8, borderRadius: 999, backgroundColor: t.accent }}>
              <Text weight="semibold" style={{ fontSize: 12, color: t.onAccent }}>
                Danas
              </Text>
            </View>
          )}
          {isMissed && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <CircleExclamationPoint size={14} color={t.danger} strokeWidth={2.25} />
              <Text tone="danger" weight="semibold" style={{ fontSize: 14 }}>
                Propušteno
              </Text>
            </View>
          )}
          {activity.completed && (
            <Text tone="success" weight="semibold" style={{ fontSize: 14 }}>
              Završeno
            </Text>
          )}
        </View>
      </View>
      <Text tone="muted" weight="semibold" style={{ fontSize: 15 }}>
        {formatHours(activity.durationMinutes)}
      </Text>
    </Pressable>
  );
}
