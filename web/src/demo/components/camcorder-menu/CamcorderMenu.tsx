import { useState } from "react";
import { Z } from "../../design-tokens";
import { MenuButton } from "./MenuButton";
import { MenuOverlay } from "./MenuOverlay";
import type { CamcorderMenuProps } from "./types";

export function CamcorderMenu(props: CamcorderMenuProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div style={{ position: "absolute", top: 10, left: 10, zIndex: Z.menuButton, pointerEvents: "auto" }}>
        <MenuButton onClick={() => setOpen((v) => !v)} active={open} />
      </div>
      {open && <MenuOverlay onClose={() => setOpen(false)} {...props} />}
    </>
  );
}
