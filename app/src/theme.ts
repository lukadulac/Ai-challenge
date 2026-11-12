import { useColorScheme } from "react-native";

// Colors from the approved design (Claude Design canvas "Study Planner app design").
const light = {
  bg: "#F5F6FA",
  surface: "#FFFFFF",
  field: "#F5F6FA",
  border: "#E2E5EE",
  text: "#151821",
  muted: "#5C6275",
  placeholder: "#6B7183",
  accent: "#4F46E5",
  accentSoft: "#EEF0FF",
  onAccent: "#FFFFFF",
  neutralSoft: "#EEF0F5",
  success: "#166534",
  successFill: "#16A34A",
  onSuccess: "#FFFFFF",
  danger: "#B42318",
  dangerSoft: "#FDECEA",
  track: "#E4E7F0",
  idleCircle: "#9AA0B1",
};

export type Theme = typeof light;

const dark: Theme = {
  bg: "#0D0F14",
  surface: "#171A22",
  field: "#20242E",
  border: "#2A2F3B",
  text: "#EDEFF5",
  muted: "#A3A9BA",
  placeholder: "#8A90A2",
  accent: "#8E88FF",
  accentSoft: "#262650",
  onAccent: "#0D0F14",
  neutralSoft: "#20242E",
  success: "#5BD68A",
  successFill: "#22A55A",
  onSuccess: "#0D0F14",
  danger: "#FF7A6E",
  dangerSoft: "#3B1A18",
  track: "#2A2F3B",
  idleCircle: "#5E6475",
};

export function useTheme(): Theme {
  return useColorScheme() === "dark" ? dark : light;
}

export const fonts = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
} as const;
