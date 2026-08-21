import { CSSProperties } from "react";

export default function Skeleton({ width = "100%", height = 16, style }: { width?: string | number; height?: string | number; style?: CSSProperties }) {
  return <div className="skeleton" style={{ width, height, ...style }} />;
}
