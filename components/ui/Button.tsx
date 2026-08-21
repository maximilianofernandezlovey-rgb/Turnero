import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";
type Size = "sm" | "md" | "lg";

export default function Button({
  variant = "primary",
  size = "md",
  block,
  className = "",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; block?: boolean }) {
  const sizeClass = size === "sm" ? "btn-sm" : size === "lg" ? "btn-lg" : "";
  return (
    <button
      type={rest.type || "button"}
      className={`btn btn-${variant} ${sizeClass} ${block ? "btn-block" : ""} ${className}`.trim()}
      {...rest}
    />
  );
}
