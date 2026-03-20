import { MENU_CATEGORIES } from "./schema";
import { MENU_SIZE, MENU_COLOR } from "./tokens";
import type { MenuAction, MenuCategory } from "./types";

interface CategorySidebarProps {
  current: MenuCategory;
  horizontal: boolean;
  onSelect: (action: MenuAction) => void;
}

export function CategorySidebar({ current, horizontal, onSelect }: CategorySidebarProps) {
  return (
    <div style={{
      background: MENU_COLOR.sidebarBg,
      display: "flex",
      flexDirection: horizontal ? "row" : "column",
      ...(horizontal
        ? { width: "100%", justifyContent: "flex-start", gap: 0 }
        : { paddingTop: "1%" }),
    }}>
      {MENU_CATEGORIES.map((c) => {
        const isActive = c.action !== "close" && current === c.action;
        const Icon = c.icon;
        const size = c.action === "close" ? MENU_SIZE.closeIcon : MENU_SIZE.sidebarIcon;
        return (
          <button
            key={c.action}
            onClick={() => onSelect(c.action)}
            title={c.label}
            style={{
              ...(horizontal
                ? { width: "20%", height: MENU_SIZE.tabButtonH }
                : { width: "100%", height: MENU_SIZE.sidebarButtonH }),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: "none",
              color: isActive ? MENU_COLOR.accent : MENU_COLOR.textInactive,
              cursor: "pointer",
            }}
          >
            <Icon size={size} />
          </button>
        );
      })}
    </div>
  );
}
