import DateTimePicker from "@react-native-community/datetimepicker";
import { type PlannedActivity, planInputSchema, planLimits, weeklyHalfHours } from "backend/contract";
import { router } from "expo-router";
import { Calendar, Minus, Plus } from "lucide-react-native";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, useColorScheme, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { activityTypes } from "../../activity-type";
import { describeFailure, type FieldErrors, splitFieldErrors, validate, withoutField } from "../../forms";
import {
  activitiesCount,
  addDays,
  daysBetween,
  formatDate,
  formatHours,
  formatShortDate,
  fromLocalDate,
  hoursNumber,
  localToday,
  plural,
  toLocalDate,
  weekday,
  weekdayShort,
} from "../../format";
import { useCreatePlan, useProposal } from "../../plans";
import { useTheme } from "../../theme";
import { Banner, BottomBar, Button, FieldError, styles, Text, TextField } from "../../ui";

const planFields = ["subject", "examDate", "weeklyHours"] as const;

export default function NewPlanScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const today = localToday();
  const [subject, setSubject] = useState("");
  const [examDate, setExamDate] = useState(() => addDays(today, 14));
  const [weeklyHours, setWeeklyHours] = useState(6);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [failure, setFailure] = useState<string | null>(null);
  const proposal = useProposal();
  const createPlan = useCreatePlan((plan) => router.replace(`/plans/${plan.id}`));

  // Any change to the inputs makes the shown Proposal stale, so it goes, and so does
  // the changed field's error.
  const edit = <T,>(field: (typeof planFields)[number], set: (value: T) => void) => (value: T) => {
    set(value);
    proposal.reset();
    setFailure(null);
    setFieldErrors((errors) => withoutField(errors, field));
  };

  const showFailure = (error: Error) => {
    const { fields, banner } = describeFailure(error, planFields);
    setFieldErrors(fields);
    setFailure(banner);
  };

  const validInput = () => {
    const { data, errors } = validate(planInputSchema, { subject, examDate, weeklyHours, today });
    const { fields, banner } = splitFieldErrors(errors ?? {}, planFields);
    setFieldErrors(fields);
    setFailure(banner);
    return data;
  };

  const showProposal = () => {
    const input = validInput();
    if (input) proposal.mutate(input, { onError: showFailure });
  };

  const save = () => {
    const input = validInput();
    if (input) createPlan.mutate(input, { onError: showFailure });
  };

  const daysToExam = daysBetween(today, examDate);
  // Earliest day first, and the earliest days get any leftover half-hours.
  const halfHours = weeklyHalfHours(weeklyHours);
  const daysPerWeek = halfHours.length;
  const longest = halfHours[0]! * 30;
  const shortest = halfHours.at(-1)! * 30;
  const perDay = longest === shortest ? formatHours(longest) : `${hoursNumber(shortest)}–${formatHours(longest)}`;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: insets.top, paddingHorizontal: 20, paddingBottom: 140, gap: 20 }}
      >
        <View style={{ height: 44, flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={{ position: "absolute", left: -8, minHeight: 44, justifyContent: "center", paddingHorizontal: 8 }}
          >
            <Text tone="accent" style={{ fontSize: 17 }}>
              Otkaži
            </Text>
          </Pressable>
          <Text accessibilityRole="header" weight="semibold" style={{ fontSize: 17 }}>
            Novi plan
          </Text>
        </View>

        {failure && <Banner message={failure} />}

        <View style={[styles.card, { gap: 20, paddingVertical: 20, paddingHorizontal: 16, backgroundColor: t.surface, borderColor: t.border }]}>
          <TextField
            label="Naziv predmeta"
            value={subject}
            onChangeText={edit("subject", setSubject)}
            error={fieldErrors.subject}
            placeholder="npr. Matematika 1"
            maxLength={planLimits.maxSubjectLength}
            style={{ backgroundColor: t.field }}
          />

          <View style={{ gap: 8 }}>
            <Text weight="semibold" style={{ fontSize: 14 }}>
              Datum ispita
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Datum ispita: ${weekday(examDate)}, ${formatDate(examDate)}`}
              accessibilityState={{ expanded: pickerOpen }}
              onPress={() => setPickerOpen(!pickerOpen)}
              style={[
                styles.input,
                {
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  backgroundColor: t.field,
                  borderColor: fieldErrors.examDate ? t.danger : t.border,
                  borderWidth: fieldErrors.examDate ? 1.5 : 1,
                },
              ]}
            >
              <Calendar size={20} color={t.accent} />
              <Text style={{ flex: 1 }}>
                {weekday(examDate)}, {formatDate(examDate)}
              </Text>
              <Text tone="muted" style={{ fontSize: 14 }}>
                za {daysToExam} {plural(daysToExam, "dan", "dana")}
              </Text>
            </Pressable>
            {pickerOpen && (
              <ExamDatePicker
                value={examDate}
                today={today}
                onPick={(date) => {
                  edit("examDate", setExamDate)(date);
                  if (Platform.OS !== "ios") setPickerOpen(false);
                }}
                onDismiss={() => setPickerOpen(false)}
              />
            )}
            {fieldErrors.examDate && <FieldError message={fieldErrors.examDate} />}
          </View>

          <View style={{ gap: 8 }}>
            <Text weight="semibold" style={{ fontSize: 14 }}>
              Sati nedeljno za učenje
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <StepButton label="Smanji broj sati" icon="minus" disabled={weeklyHours <= planLimits.minWeeklyHours} onPress={() => edit("weeklyHours", setWeeklyHours)(weeklyHours - 1)} />
              <Text accessibilityLiveRegion="polite" weight="bold" style={{ flex: 1, textAlign: "center", fontSize: 28, letterSpacing: -0.5 }}>
                {weeklyHours} h
              </Text>
              <StepButton label="Povećaj broj sati" icon="plus" disabled={weeklyHours >= planLimits.maxWeeklyHours} onPress={() => edit("weeklyHours", setWeeklyHours)(weeklyHours + 1)} />
            </View>
            <Text tone="muted" style={{ textAlign: "center", fontSize: 14 }}>
              {daysPerWeek} {plural(daysPerWeek, "dan", "dana")} nedeljno po {perDay}
            </Text>
            {fieldErrors.weeklyHours && <FieldError message={fieldErrors.weeklyHours} />}
          </View>
        </View>

        {proposal.data && <ProposalList activities={proposal.data.activities} totalMinutes={proposal.data.totalMinutes} />}
      </ScrollView>

      <BottomBar>
        {proposal.data ? (
          <Button label="Sačuvaj plan" onPress={save} busy={createPlan.isPending} />
        ) : (
          <Button label="Prikaži predlog" onPress={showProposal} busy={proposal.isPending} />
        )}
      </BottomBar>
    </KeyboardAvoidingView>
  );
}

function ExamDatePicker({
  value,
  today,
  onPick,
  onDismiss,
}: {
  value: string;
  today: string;
  onPick: (date: string) => void;
  onDismiss: () => void;
}) {
  const t = useTheme();
  const scheme = useColorScheme();
  return (
    <DateTimePicker
      value={toLocalDate(value)}
      mode="date"
      display={Platform.OS === "ios" ? "inline" : "default"}
      minimumDate={toLocalDate(addDays(today, 1))}
      maximumDate={toLocalDate(addDays(today, planLimits.maxDaysToExam))}
      locale="sr-Latn-RS"
      accentColor={t.accent}
      themeVariant={scheme === "dark" ? "dark" : "light"}
      onValueChange={(_event, date) => onPick(fromLocalDate(date))}
      onDismiss={onDismiss}
    />
  );
}

function StepButton({ label, icon, disabled, onPress }: { label: string; icon: "minus" | "plus"; disabled: boolean; onPress: () => void }) {
  const t = useTheme();
  const Icon = icon === "minus" ? Minus : Plus;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 52,
        height: 52,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: t.border,
        backgroundColor: t.field,
        alignItems: "center",
        justifyContent: "center",
        opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
      })}
    >
      <Icon size={22} color={t.text} strokeWidth={2.25} />
    </Pressable>
  );
}

function ProposalList({ activities, totalMinutes }: { activities: PlannedActivity[]; totalMinutes: number }) {
  const t = useTheme();
  return (
    <View style={{ gap: 12 }}>
      <View style={{ gap: 4 }}>
        <Text accessibilityRole="header" weight="bold" style={{ fontSize: 22, letterSpacing: -0.3 }}>
          Predlog plana
        </Text>
        <Text tone="muted" style={{ fontSize: 15 }}>
          {activitiesCount(activities.length)} · {formatHours(totalMinutes)} ukupno
        </Text>
      </View>
      <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border, overflow: "hidden" }]}>
        {activities.map((activity, index) => {
          const { label, icon: Icon } = activityTypes[activity.type];
          return (
            <View
              key={activity.date}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
                minHeight: 60,
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderTopWidth: index === 0 ? 0 : 1,
                borderTopColor: t.border,
              }}
            >
              <View style={{ width: 52, gap: 2 }}>
                <Text tone="muted" weight="semibold" style={{ fontSize: 12, letterSpacing: 0.5, textTransform: "uppercase" }}>
                  {weekdayShort(activity.date)}
                </Text>
                <Text weight="semibold" style={{ fontSize: 15 }}>
                  {formatShortDate(activity.date)}
                </Text>
              </View>
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Icon size={18} color={t.accent} />
                <Text weight="medium">{label}</Text>
              </View>
              <Text tone="muted" weight="semibold" style={{ fontSize: 15 }}>
                {formatHours(activity.durationMinutes)}
              </Text>
            </View>
          );
        })}
      </View>
      <Text tone="muted" style={{ fontSize: 14, lineHeight: 20 }}>
        Poslednja aktivnost je dan pre ispita. Promeni sate ili datum i predlog se pravi ponovo.
      </Text>
    </View>
  );
}
