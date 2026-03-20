import { useState } from "react";
import { useOrientation } from "../../hooks/useOrientation";
import { LayoutPresetPicker } from "../layout";
import { getSettingsByCategory } from "../../camcorder-settings";
import { Z } from "../../design-tokens";
import { CategorySidebar } from "./CategorySidebar";
import { SettingRow } from "./SettingRow";
import { PresetBar } from "./PresetBar";
import { CATEGORY_TITLES } from "./schema";
import { MENU_SIZE, MENU_COLOR, MENU_TITLE_STYLE, MENU_FOOTER_STYLE } from "./tokens";
import type { MenuOverlayProps, MenuCategory, MenuAction } from "./types";

export function MenuOverlay({
  onClose, paramValues, activePreset, onParamChange, onPresetChange,
  overlayPreset, onLayoutPresetChange, camcorderState, onStateChange,
}: MenuOverlayProps) {
  const [cat, setCat] = useState<MenuCategory>("camera");
  const orientation = useOrientation();
  const L = orientation === "landscape";

  const handleSelect = (action: MenuAction) => {
    if (action === "close") onClose();
    else setCat(action);
  };

  const content = () => {
    if (cat === "display") {
      return (
        <>
          <LayoutPresetPicker value={overlayPreset} onChange={onLayoutPresetChange} />
          <div style={{ marginTop: 8 }}>
            {getSettingsByCategory("display").map((s) => (
              <SettingRow key={s.id} setting={s} currentParams={paramValues}
                onParamChange={onParamChange} camcorderState={camcorderState} onStateChange={onStateChange} />
            ))}
          </div>
        </>
      );
    }
    const settings = getSettingsByCategory(cat);
    return (
      <>
        {(cat === "camera" || cat === "quality") && (
          <PresetBar activePreset={activePreset} onPresetChange={onPresetChange} />
        )}
        {settings.map((s) => (
          <SettingRow key={s.id} setting={s} currentParams={paramValues}
            onParamChange={onParamChange} camcorderState={camcorderState} onStateChange={onStateChange} />
        ))}
      </>
    );
  };

  const contentInner = (
    <>
      <div style={MENU_TITLE_STYLE}>
        {CATEGORY_TITLES[cat]}
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "0 4px" }}>
        {content()}
      </div>
      <button onClick={onClose} style={MENU_FOOTER_STYLE}>
        MENU 終了
      </button>
    </>
  );

  if (L) {
    return (
      <div style={{ position: "absolute", inset: 0, zIndex: Z.menu, display: "flex", pointerEvents: "auto" }}>
        <div style={{ width: MENU_SIZE.sidebarWidth, display: "flex", flexDirection: "column" }}>
          <CategorySidebar current={cat} horizontal={false} onSelect={handleSelect} />
        </div>
        <div style={{
          width: MENU_SIZE.contentWidth, background: MENU_COLOR.panelBg,
          overflowY: "auto", display: "flex", flexDirection: "column",
        }}>
          {contentInner}
        </div>
        <div onClick={onClose} style={{ flex: 1, cursor: "pointer" }} />
      </div>
    );
  }

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: Z.menu, display: "flex", flexDirection: "column", pointerEvents: "auto" }}>
      <div onClick={onClose} style={{ flex: 1, cursor: "pointer" }} />
      <CategorySidebar current={cat} horizontal={true} onSelect={handleSelect} />
      <div style={{
        height: MENU_SIZE.contentHeight, background: MENU_COLOR.panelBg,
        overflowY: "auto", display: "flex", flexDirection: "column",
      }}>
        {contentInner}
      </div>
    </div>
  );
}
