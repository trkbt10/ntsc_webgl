import { ArrowLeft, Download, Trash2 } from "lucide-react";
import type { MediaEntry } from "../../media-store-types";
import { HARDWARE_BUTTON, HARDWARE_BUTTON_DANGER, CONTROL, COLOR, Z, TRANSITION } from "../../design-tokens";
import { useBlobUrl } from "../../hooks/useBlobUrl";
import { useMedia } from "../../contexts/MediaContext";
import { formatSize, formatTimestamp } from "../../utils/format";

interface MediaPreviewProps {
  entry: MediaEntry;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export function MediaPreview({ entry, onClose, onDelete }: MediaPreviewProps) {
  const { downloadEntry } = useMedia();
  const blobUrl = useBlobUrl(entry.blob, entry.id);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: Z.gallery,
      background: COLOR.overlayBg,
      display: "flex", flexDirection: "column",
      viewTransitionName: TRANSITION.galleryPreview,
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px", flexShrink: 0,
      }}>
        <button onClick={onClose} style={{ ...HARDWARE_BUTTON, fontSize: 11, padding: "5px 12px" }}>
          <ArrowLeft size={14} strokeWidth={CONTROL.iconStroke} />
          <span>BACK</span>
        </button>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => downloadEntry(entry)} style={{ ...HARDWARE_BUTTON, fontSize: 11, padding: "5px 12px" }}>
            <Download size={14} strokeWidth={CONTROL.iconStroke} />
            <span>SAVE</span>
          </button>
          <button onClick={() => { onDelete(entry.id); onClose(); }} style={{ ...HARDWARE_BUTTON_DANGER, fontSize: 11, padding: "5px 12px" }}>
            <Trash2 size={14} strokeWidth={CONTROL.iconStroke} />
            <span>DEL</span>
          </button>
        </div>
      </div>

      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden", padding: 16,
      }}>
        {blobUrl && (entry.type === "photo" ? (
          <img
            src={blobUrl}
            alt=""
            style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 4 }}
          />
        ) : (
          <video
            src={blobUrl}
            controls
            autoPlay
            style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 4 }}
          />
        ))}
      </div>

      <div style={{
        padding: "8px 16px 12px", flexShrink: 0,
        fontSize: 11, color: COLOR.textSecondary,
        display: "flex", gap: 16,
      }}>
        <span>{entry.width}×{entry.height}</span>
        <span>{formatSize(entry.size)}</span>
        <span>{formatTimestamp(entry.timestamp)}</span>
        {entry.duration != null && <span>{(entry.duration / 1000).toFixed(1)}s</span>}
      </div>
    </div>
  );
}
