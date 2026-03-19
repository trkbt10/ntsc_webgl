import { HashRouter, Routes, Route } from "react-router";
import { HomePage } from "./pages/HomePage";
import { CameraPage } from "./pages/CameraPage";
import { VideoCamPage } from "./pages/VideoCamPage";

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/camera" element={<CameraPage />} />
        <Route path="/video-cam" element={<VideoCamPage />} />
      </Routes>
    </HashRouter>
  );
}
