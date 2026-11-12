import type { ActivityType } from "backend/contract";
import { BookOpen, ClipboardCheck, type LucideIcon, RotateCcw } from "lucide-react-native";

export const activityTypes: Record<ActivityType, { label: string; icon: LucideIcon }> = {
  learning: { label: "Novo gradivo", icon: BookOpen },
  review: { label: "Ponavljanje", icon: RotateCcw },
  mock_exam: { label: "Probni ispit", icon: ClipboardCheck },
};
