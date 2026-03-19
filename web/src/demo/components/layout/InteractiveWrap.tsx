/** Enables pointer events on children within a pointerEvents:none overlay */
export function InteractiveWrap({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ pointerEvents: "auto", ...style }}>{children}</div>;
}
