import { Link } from "react-router";

interface CameraErrorViewProps {
  pipelineError?: string | null;
  cameraError?: string | null;
}

export function CameraErrorView({ pipelineError, cameraError }: CameraErrorViewProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        gap: 16,
      }}
    >
      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
        {pipelineError ? `Pipeline: ${pipelineError}` : `Camera: ${cameraError}`}
      </div>
      <Link to="/" style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>
        Back
      </Link>
    </div>
  );
}
