import { useMemo } from "react";
import { Trash2 } from "lucide-react";
import type { MediaEntry } from "../../media-store-types";
import { COLOR, CONTROL } from "../../design-tokens";

interface GalleryItemProps {
  entry: MediaEntry;
  onSelect: (entry: MediaEntry) => void;
  onDelete: (id: string) => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function GalleryItem({ entry, onSelect, onDelete }: GalleryItemProps) {
  const thumbUrl = useMemo(() => URL.createObjectURL(entry.thumbnail), [entry.thumbnail]);

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 8,
        overflow: "hidden",
        background: "#111",
        cursor: "pointer",
        aspectRatio: "16/9",
        viewTransitionName: `gallery-item-${entry.id}`,
      }}
      onClick={() => onSelect(entry)}
    >
      <img
        src={thumbUrl}
        alt=""
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />

      {/* Type badge */}
      <span style={{
        position: "absolute", top: 4, left: 4,
        background: entry.type === "video" ? COLOR.videoBadge : COLOR.photoBadge,
        color: COLOR.textPrimary, fontSize: 9, fontWeight: 700,
        padding: "1px 5px", borderRadius: 3,
        textTransform: "uppercase",
      }}>
        {entry.type}
      </span>

      {/* Delete button */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }}
        title="Delete"
        style={{
          position: "absolute", top: 4, right: 4,
          width: 22, height: 22, borderRadius: 4,
          border: "1px solid rgba(255,80,80,0.4)",
          background: "rgba(80,0,0,0.7)",
          color: "#ff6666", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 0,
        }}
      >
        <Trash2 size={12} strokeWidth={CONTROL.iconStroke} />
      </button>

      {/* Info bar */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
        padding: "12px 6px 4px",
        display: "flex", justifyContent: "space-between", alignItems: "flex-end",
        fontSize: 10, color: COLOR.textSecondary,
      }}>
        <span>{formatDate(entry.timestamp)}</span>
        <span>{formatSize(entry.size)}</span>
      </div>
    </div>
  );
}
