"use client";

type Variant = "default" | "success" | "warning" | "danger" | "info";

interface StatusBadgeProps {
  label: string;
  variant?: Variant;
}

const variantStyles: Record<Variant, string> = {
  default: "bg-gray-100 text-gray-700",
  success: "bg-green-50 text-green-700",
  warning: "bg-yellow-50 text-yellow-700",
  danger: "bg-red-50 text-red-700",
  info: "bg-blue-50 text-blue-700",
};

export default function StatusBadge({ label, variant = "default" }: StatusBadgeProps) {
  return (
    <span className={`inline-block px-2.5 py-0.5 text-xs font-medium rounded-full ${variantStyles[variant]}`}>
      {label}
    </span>
  );
}
