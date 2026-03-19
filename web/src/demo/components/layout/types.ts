import type { CamcorderDisplayState } from "../../camcorder-settings";

/** All data sources + callbacks that a layout preset receives */
export type Orientation = "portrait" | "landscape";

export interface LayoutProps {
  recording: boolean;
  fps: number;
  batteryLevel: number | null;
  batterySupported: boolean;
  cameraWidth: number;
  cameraHeight: number;
  audioChannels: number;
  audioStream: MediaStream | null;
  recordingSupported: boolean;
  onFlipCamera: () => void;
  onToggleRecord: () => void;
  camcorderState?: CamcorderDisplayState;
  orientation: Orientation;
}

/** Convenience: extract common display toggles from camcorderState */
export function displayToggles(p: LayoutProps) {
  return {
    showMeter: p.camcorderState?.levelMeter ?? true,
    showGrid: p.camcorderState?.gridDisplay ?? false,
  };
}
