import { useVisualBuilderSettings } from "@/contexts/VisualBuilderContext";

export type HolidayThemeId =
  | "default"
  | "main"
  | "christmas"
  | "halloween"
  | "easter"
  | "valentines"
  | "4thofjuly"
  | "blackfriday";

export function useHolidayTheme() {
  const { settings } = useVisualBuilderSettings();
  const theme = (settings.holiday_theme || "default") as HolidayThemeId;
  const active = theme !== "default" && theme !== "main" && Boolean(theme);

  return {
    theme,
    active,
    isChristmas: theme === "christmas",
    isHalloween: theme === "halloween",
    isEaster: theme === "easter",
    isValentines: theme === "valentines",
    isFourthOfJuly: theme === "4thofjuly",
    isBlackFriday: theme === "blackfriday",
  };
}
