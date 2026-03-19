/**
 * @source MediaStreamTrack.getSettings().channelCount
 * @support Universal (with audio track)
 * @description Shows audio channel format (1ch/2ch) from actual audio track.
 *   Returns null if no audio information available.
 */

export function AudioChannel({ channels }: { channels: number }) {
  if (channels <= 0) return null;
  const label = channels >= 2 ? "2ch" : "1ch";
  return (
    <span style={{ fontFamily: "monospace", fontSize: 11, color: "rgba(255,255,255,0.6)", textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
      ♪{label}
    </span>
  );
}
