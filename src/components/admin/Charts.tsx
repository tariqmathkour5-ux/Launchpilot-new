"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

const COLORS = {
  primary: "#3B82F6",
  secondary: "#64748B",
  accent: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  purple: "#8B5CF6",
  pink: "#EC4899",
  cyan: "#06B6D4",
  orange: "#F97316",
  teal: "#14B8A6",
};

const CHART_COLORS = [
  COLORS.primary,
  COLORS.accent,
  COLORS.warning,
  COLORS.purple,
  COLORS.pink,
  COLORS.cyan,
  COLORS.orange,
  COLORS.teal,
  COLORS.secondary,
  COLORS.error,
];

interface LineChartProps {
  data: Array<{ date: string; count: number; [key: string]: unknown }>;
  dataKey?: string;
  name?: string;
  color?: string;
  height?: number;
}

export function SimpleLineChart({
  data,
  dataKey = "count",
  name = "Count",
  color = COLORS.primary,
  height = 300,
}: LineChartProps) {
  const formattedData = data.map((d) => ({
    ...d,
    [dataKey]: Number(d[dataKey] || 0),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={formattedData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: "#6B7280" }}
          tickFormatter={(value: string) => {
            if (typeof value === "string" && value.includes("-")) {
              const parts = value.split("-");
              return `${parts[1]}/${parts[2]?.slice(0, 2) || ""}`;
            }
            return value;
          }}
        />
        <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#FFF",
            border: "1px solid #E5E7EB",
            borderRadius: "8px",
          }}
        />
        <Line
          type="monotone"
          dataKey={dataKey}
          name={name}
          stroke={color}
          strokeWidth={2}
          dot={{ fill: color, strokeWidth: 2, r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

interface AreaChartProps {
  data: Array<{ date: string; [key: string]: number | string }>;
  keys: string[];
  height?: number;
}

export function StackedAreaChart({ data, keys, height = 300 }: AreaChartProps) {
  const formattedData = data.map((d) => {
    const result: Record<string, number | string> = { date: String(d.date) };
    keys.forEach((key) => {
      result[key] = Number(d[key] || 0);
    });
    return result;
  });

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={formattedData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: "#6B7280" }}
          tickFormatter={(value: string) => {
            if (typeof value === "string" && value.includes("-")) {
              const parts = value.split("-");
              return `${parts[1]}/${parts[2]?.slice(0, 2) || ""}`;
            }
            return value;
          }}
        />
        <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#FFF",
            border: "1px solid #E5E7EB",
            borderRadius: "8px",
          }}
        />
        <Legend />
        {keys.map((key, index) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            stackId="1"
            stroke={CHART_COLORS[index % CHART_COLORS.length]}
            fill={CHART_COLORS[index % CHART_COLORS.length]}
            fillOpacity={0.6}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

interface BarChartProps {
  data: Array<{ name: string; value: number }>;
  dataKey?: string;
  name?: string;
  color?: string;
  height?: number;
  horizontal?: boolean;
}

export function SimpleBarChart({
  data,
  dataKey = "value",
  name = "Value",
  color = COLORS.primary,
  height = 300,
  horizontal = false,
}: BarChartProps) {
  if (horizontal) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis type="number" tick={{ fontSize: 12, fill: "#6B7280" }} />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fontSize: 11, fill: "#6B7280" }}
            width={100}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#FFF",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
            }}
          />
          <Bar dataKey={dataKey} name={name} fill={color} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "#6B7280" }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#FFF",
            border: "1px solid #E5E7EB",
            borderRadius: "8px",
          }}
        />
        <Bar dataKey={dataKey} name={name} fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface PieChartProps {
  data: Array<{ name: string; value: number }>;
  height?: number;
}

export function SimplePieChart({ data, height = 300 }: PieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          label={({ name, percent }: { name?: string; percent?: number }) =>
            `${name || 'Unknown'} (${((percent || 0) * 100).toFixed(0)}%)`
          }
          labelLine={true}
        >
          {data.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={CHART_COLORS[index % CHART_COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "#FFF",
            border: "1px solid #E5E7EB",
            borderRadius: "8px",
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export { COLORS };
