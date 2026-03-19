import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { HARDWARE_BUTTON, CONTROL } from "../../design-tokens";

interface BackButtonProps {
  to?: string;
}

export function BackButton({ to = "/" }: BackButtonProps) {
  return (
    <Link
      to={to}
      title="Back"
      style={{
        ...HARDWARE_BUTTON,
        fontSize: 11,
        padding: "5px 10px",
        textDecoration: "none",
      }}
    >
      <ArrowLeft size={14} strokeWidth={CONTROL.iconStroke} />
    </Link>
  );
}
