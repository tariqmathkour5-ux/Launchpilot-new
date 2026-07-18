"use client";

import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: "primary" | "accent" | "secondary" | "success" | "warning" | "error";
}

const colorMap = {
  primary: { bg: "bg-primary-100", icon: "text-primary-600", text: "text-primary-600" },
  accent: { bg: "bg-accent-100", icon: "text-accent-600", text: "text-accent-600" },
  secondary: { bg: "bg-secondary-100", icon: "text-secondary-600", text: "text-secondary-600" },
  success: { bg: "bg-success-100", icon: "text-success-600", text: "text-success-600" },
  warning: { bg: "bg-warning-100", icon: "text-warning-600", text: "text-warning-600" },
  error: { bg: "bg-error-100", icon: "text-error-600", text: "text-error-600" },
};

export default function StatsCard({ title, value, icon: Icon, trend, color = "primary" }: StatsCardProps) {
  const colors = colorMap[color];

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-secondary-500">{title}</p>
          <p className="text-3xl font-bold text-secondary-900 mt-1">{value}</p>
          {trend && (
            <p className={`text-sm mt-2 ${trend.isPositive ? "text-success-600" : "text-error-600"}`}>
              {trend.isPositive ? "+" : ""}
              {trend.value}% from last month
            </p>
          )}
        </div>
        <div className={`h-12 w-12 rounded-lg ${colors.bg} flex items-center justify-center`}>
          <Icon className={`h-6 w-6 ${colors.icon}`} />
        </div>
      </div>
    </div>
  );
}
