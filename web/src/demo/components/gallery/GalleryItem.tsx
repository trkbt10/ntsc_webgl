import { Trash2 } from "lucide-react";
import type { MediaEntry } from "../../media-store-types";
import { COLOR, CONTROL, TRANSITION } from "../../design-tokens";
import { useBlobUrl } from "../../hooks/useBlobUrl";
import { formatSize, formatDate } from "../../utils/format";

interface GalleryItemProps {
  entry: MediaEntry;
  onSelect: (entry: MediaEntry) => void;
  onDelete: (id: string) => void;
}

export function GalleryItem({ entry, onSelect, onDelete }: GalleryItemProps) {
  const thumbUrl = useBlobUrl(entry.thumbnail, entry.id);

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 8,
        overflow: "hidden",
        background: "#111",
        cursor: "pointer",
        aspectRatio: "16/9",
        viewTransitionName: TRANSITION.galleryItem(entry.id),
      }}
      onClick={() => onSelect(entry)}
    >
      {thumbUrl && (
        <img
          src={thumbUrl}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      )}

      <span style={{
        position: "absolute", top: 4, left: 4,
        background: entry.type === "video" ? COLOR.videoBadge : COLOR.photoBadge,
        color: COLOR.textPrimary, fontSize: 9, fontWeight: 700,
        padding: "1px 5px", borderRadius: 3,
        textTransform: "uppercase",
      }}>
        {entry.type}
      </span>

      <button
        onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }}
        title="Delete"
        style={{
          position: "absolute", top: 4, right: 4,
          width: 22, height: 22, borderRadius: 4,
          border: `1px solid ${COLOR.dangerBorder}`,
          background: COLOR.dangerBg,
          color: COLOR.dangerText, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 0,
        }}
      >
        <Trash2 size={12} strokeWidth={CONTROL.iconStroke} />
      </button>

      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        background: COLOR.gradientFade,
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
