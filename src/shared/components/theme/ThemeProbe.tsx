type ThemeProbeProps = {
  label?: string;
};

export function ThemeProbe({ label = 'Balanced Warmth Active' }: ThemeProbeProps) {
  return (
    <div
      className="theme-probe rounded-2xl bg-primary px-6 py-4 text-base font-semibold text-white shadow-xl shadow-primary/30"
      data-testid="theme-probe"
    >
      {label}
    </div>
  );
}
