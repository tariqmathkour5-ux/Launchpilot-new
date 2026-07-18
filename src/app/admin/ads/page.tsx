"use client";

import { useEffect, useState } from "react";
import { Megaphone, Plus, Pause, Play } from "lucide-react";
import DataTable from "@/components/admin/DataTable";
import Link from "next/link";

interface Ad {
  id: string;
  title: string;
  position: string;
  type: string;
  status: string;
  clicks: number;
  impressions: number;
  startDate: string;
  endDate: string;
}

export default function AdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      const res = await fetch("/api/admin/ads");
      if (res.ok) {
        const data = await res.json();
        setAds(data);
      }
    } catch (error) {
      console.error("Failed to fetch ads:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    { key: "title", header: "Title" },
    {
      key: "position",
      header: "Position",
      render: (item: Ad) => item.position,
    },
    { key: "type", header: "Type" },
    {
      key: "status",
      header: "Status",
      render: (item: Ad) => (
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            item.status === "ACTIVE"
              ? "bg-success-100 text-success-700"
              : item.status === "PAUSED"
              ? "bg-warning-100 text-warning-700"
              : "bg-secondary-100 text-secondary-700"
          }`}
        >
          {item.status}
        </span>
      ),
    },
    { key: "clicks", header: "Clicks" },
    { key: "impressions", header: "Impressions" },
    {
      key: "startDate",
      header: "Start",
      render: (item: Ad) => new Date(item.startDate).toLocaleDateString(),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Advertisements</h1>
          <p className="text-secondary-500 mt-1">Manage ads and campaigns</p>
        </div>
        <Link href="/admin/ads/new" className="btn btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Create Ad
        </Link>
      </div>

      <DataTable
        data={ads}
        columns={columns}
        searchPlaceholder="Search ads..."
        loading={isLoading}
      />
    </div>
  );
}
