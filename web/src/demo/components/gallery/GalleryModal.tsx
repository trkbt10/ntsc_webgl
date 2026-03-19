import { useState } from "react";
import { X } from "lucide-react";
import type { MediaEntry } from "../../media-store-types";
import { HARDWARE_BUTTON, CONTROL, COLOR } from "../../design-tokens";
import { GalleryItem } from "./GalleryItem";
import { MediaPreview } from "./MediaPreview";
import { useViewTransition } from "../../hooks/useViewTransition";

interface GalleryModalProps {
  entries: MediaEntry[];
  onClose: () => void;
  onDelete: (id: string) => void;
}

export function GalleryModal({ entries, onClose, onDelete }: GalleryModalProps) {
  const [selected, setSelected] = useState<MediaEntry | null>(null);
  const { startTransition } = useViewTransition();

  const handleSelect = (entry: MediaEntry) => {
    startTransition(() => setSelected(entry));
  };

  const handleClosePreview = () => {
    startTransition(() => setSelected(null));
  };

  const handleDelete = (id: string) => {
    startTransition(() => {
      onDelete(id);
      setSelected(null);
    });
  };

  if (selected) {
    return (
      <MediaPreview
        entry={selected}
        onClose={handleClosePreview}
        onDelete={handleDelete}
      />
    );
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: COLOR.overlayBg,
      display: "flex", flexDirection: "column",
      overflow: "hidden",
      viewTransitionName: "gallery-modal",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px", flexShrink: 0,
        borderBottom: "1px solid rgba(255,255,255,0.1)",
      }}>
        <span style={{ color: COLOR.textPrimary, fontSize: 14, fontWeight: 600 }}>
          Camera Roll ({entries.length})
        </span>
        <button onClick={onClose} style={{ ...HARDWARE_BUTTON, fontSize: 11, padding: "5px 12px" }}>
          <X size={14} strokeWidth={CONTROL.iconStroke} />
          <span>CLOSE</span>
        </button>
      </div>

      {/* Grid */}
      <div style={{ flex: 1, overflow: "auto", padding: 12 }}>
        {entries.length === 0 ? (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            height: "100%", color: COLOR.textMuted, fontSize: 14,
          }}>
            No captures yet
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: 8,
          }}>
            {entries.map((entry) => (
              <GalleryItem
                key={entry.id}
                entry={entry}
                onSelect={handleSelect}
                onDelete={(id) => startTransition(() => onDelete(id))}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
