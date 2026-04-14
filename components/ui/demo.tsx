import ThemeSwitch from "@/components/ui/theme-switch";
import { useState } from "react";

export default function DemoOne() {
  const [isDark, setIsDark] = useState(false);
  return (
    <div className="p-10 flex items-center justify-center bg-background min-h-screen">
      <ThemeSwitch checked={isDark} onCheckedChange={setIsDark} />
    </div>
  );
}
