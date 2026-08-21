import { HTMLAttributes } from "react";

export default function Card({ padded = true, className = "", ...rest }: HTMLAttributes<HTMLDivElement> & { padded?: boolean }) {
  return <div className={`surface ${padded ? "surface-pad" : ""} ${className}`.trim()} {...rest} />;
}
