import { useState, useRef, useCallback, useEffect } from "react";

export interface CameraInfo {
  width: number;
  height: number;
  frameRate: number;
  facingMode: string;
  audioChannels: number;
}

const EMPTY_INFO: CameraInfo = { width: 0, height: 0, frameRate: 0, facingMode: "", audioChannels: 0 };

interface UseCameraOptions {
  initialFacing?: string;
  enabled?: boolean;
  audio?: boolean;
}

export function useCamera({ initialFacing = "environment", enabled = false, audio = false }: UseCameraOptions = {}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState(initialFacing);
  const [cameraInfo, setCameraInfo] = useState<CameraInfo>(EMPTY_INFO);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);

  const queryTrackInfo = useCallback((stream: MediaStream) => {
    const videoTrack = stream.getVideoTracks()[0];
    const audioTrack = stream.getAudioTracks()[0];
    const info: CameraInfo = { ...EMPTY_INFO };

    if (videoTrack) {
      try {
        const settings = videoTrack.getSettings();
        info.width = settings.width ?? 0;
        info.height = settings.height ?? 0;
        info.frameRate = settings.frameRate ?? 0;
        info.facingMode = settings.facingMode ?? "";
      } catch { /* getSettings not supported */ }
    }

    if (audioTrack) {
      try {
        const settings = audioTrack.getSettings();
        info.audioChannels = settings.channelCount ?? 1;
      } catch {
        info.audioChannels = 1;
      }
    }

    setCameraInfo(info);
  }, []);

  const startCamera = useCallback(async (facing: string, withAudio: boolean) => {
    if (!videoRef.current) {
      videoRef.current = document.createElement("video");
      videoRef.current.autoplay = true;
      videoRef.current.playsInline = true;
      videoRef.current.muted = true;
    }
    const v = videoRef.current;
    if (v.srcObject) {
      (v.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: facing },
      audio: withAudio,
    });
    v.srcObject = stream;
    await v.play();
    queryTrackInfo(stream);
    const audioTracks = stream.getAudioTracks();
    setAudioStream(audioTracks.length > 0 ? new MediaStream(audioTracks) : null);
    setCameraReady(true);
    setCameraError(null);
  }, [queryTrackInfo]);

  useEffect(() => {
    if (enabled) {
      startCamera(facingMode, audio).catch((e) => {
        setCameraError(e instanceof Error ? e.message : String(e));
      });
    }
    // Only re-run when enabled changes or startCamera identity changes (stable)
    // facingMode and audio are intentionally excluded — they change via flipCamera
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, startCamera]);

  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream)
          .getTracks()
          .forEach((t) => t.stop());
      }
    };
  }, []);

  const flipCamera = useCallback(async () => {
    const next = facingMode === "user" ? "environment" : "user";
    setFacingMode(next);
    try {
      await startCamera(next, audio);
    } catch (e) {
      console.warn("Could not flip camera:", e);
    }
  }, [startCamera, facingMode, audio]);

  return {
    videoRef,
    cameraReady,
    cameraError,
    facingMode,
    flipCamera,
    cameraInfo,
    audioStream,
  };
}
