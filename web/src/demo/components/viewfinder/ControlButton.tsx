import { COLOR, RATIO } from "../../design-tokens";

export type ControlVariant = "primary" | "secondary" | "ghost";

interface ControlButtonProps {
  onClick: () => void;
  size: number;
  variant?: ControlVariant;
  title?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

const variantStyles: Record<ControlVariant, (size: number) => React.CSSProperties> = {
  primary: (size) => ({
    width: size, height: size, borderRadius: "50%",
    border: `3px solid ${COLOR.controlBorderStrong}`,
    background: "transparent",
  }),
  secondary: (size) => ({
    width: size, height: size, borderRadius: size * RATIO.controlRadius,
    border: `1.5px solid ${COLOR.controlBorder}`,
    background: COLOR.controlBg,
  }),
  ghost: (size) => ({
    width: size, height: size, borderRadius: size * RATIO.controlRadius,
    border: "none",
    background: "transparent",
  }),
};

export function ControlButton({
  onClick, size, variant = "secondary", title, children, style,
}: ControlButtonProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        ...variantStyles[variant](size),
        cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 0, color: COLOR.textPrimary,
        ...style,
      }}
    >
      {children}
    </button>
  );
}
