import { HARDWARE_BUTTON, HARDWARE_BUTTON_ACTIVE } from "../../design-tokens";
import { MENU_SIZE } from "./tokens";

interface MenuButtonProps {
  onClick: () => void;
  active: boolean;
}

export function MenuButton({ onClick, active }: MenuButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        ...(active ? HARDWARE_BUTTON_ACTIVE : HARDWARE_BUTTON),
        padding: `${MENU_SIZE.menuButtonPadY}px ${MENU_SIZE.menuButtonPadX}px`,
        fontSize: MENU_SIZE.menuButtonFontSize,
      }}
    >
      MENU
    </button>
  );
}
