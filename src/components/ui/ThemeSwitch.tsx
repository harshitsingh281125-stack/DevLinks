import { Monitor, Moon, Sun } from "lucide-react";
import { useThemePreference, type ThemePreference } from "@/lib/theme";

const OPTIONS: { value: ThemePreference; label: string; Icon: typeof Sun }[] = [
  { value: "system", label: "Match system theme", Icon: Monitor },
  { value: "light", label: "Light theme", Icon: Sun },
  { value: "dark", label: "Dark theme", Icon: Moon },
];

export function ThemeSwitch() {
  const [preference, setPreference] = useThemePreference();
  return (
    <div className="theme-switch" role="radiogroup" aria-label="Theme">
      {OPTIONS.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={preference === value}
          aria-label={label}
          title={label}
          onClick={() => setPreference(value)}
        >
          <Icon size={13} strokeWidth={1.75} />
        </button>
      ))}
    </div>
  );
}
