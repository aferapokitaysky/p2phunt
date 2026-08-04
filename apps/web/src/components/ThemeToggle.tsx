import { IconMoon, IconSun } from "./icons/NavIcons.js";
import { useThemeStore } from "../store/theme.js";

export function ThemeToggle() {
  const mode = useThemeStore((s) => s.mode);
  const toggle = useThemeStore((s) => s.toggle);

  return (
    <button
      onClick={toggle}
      title={mode === "dark" ? "Светлая тема" : "Тёмная тема"}
      className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-glassHi hover:text-ink"
    >
      {mode === "dark" ? <IconSun size={17} /> : <IconMoon size={17} />}
    </button>
  );
}
