import { HARDWARE_BUTTON, HARDWARE_BUTTON_ACTIVE, HARDWARE_BUTTON_DANGER } from "../../design-tokens";

export type HardwareVariant = "default" | "active" | "danger";

interface HardwareButtonProps {
  onClick: () => void;
  variant?: HardwareVariant;
  title?: string;
  children: React.ReactNode;
  fontSize?: number;
  padding?: string;
  style?: React.CSSProperties;
}

const VARIANT_STYLES: Record<HardwareVariant, React.CSSProperties> = {
  default: HARDWARE_BUTTON,
  active: HARDWARE_BUTTON_ACTIVE,
  danger: HARDWARE_BUTTON_DANGER,
};

export function HardwareButton({
  onClick, variant = "default", title, children, fontSize = 11, padding = "5px 12px", style,
}: HardwareButtonProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        ...VARIANT_STYLES[variant],
        fontSize,
        padding,
        ...style,
      }}
    >
      {children}
    </button>
  );
}
