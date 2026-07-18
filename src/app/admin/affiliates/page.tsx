"use client";

import { useEffect, useState } from "react";
import { Link2, Plus, Edit, TrendingUp } from "lucide-react";
import DataTable from "@/components/admin/DataTable";
import Link from "next/link";

interface Affiliate {
  id: string;
  name: string;
  email: string;
  code: string;
  commission: number;
  status: string;
  clicks: number;
  conversions: number;
  earnings: number;
}

export default function AffiliatesPage() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAffiliates();
  }, []);

  const fetchAffiliates = async () => {
    try {
      const res = await fetch("/api/admin/affiliates");
      if (res.ok) {
        const data = await res.json();
        setAffiliates(data);
      }
    } catch (error) {
      console.error("Failed to fetch affiliates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    { key: "name", header: "Partner Name" },
    { key: "email", header: "Email" },
    { key: "code", header: "Code" },
    {
      key: "commission",
      header: "Commission",
      render: (item: Affiliate) => `${item.commission}%`,
    },
    {
      key: "status",
      header: "Status",
      render: (item: Affiliate) => (
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            item.status === "ACTIVE"
              ? "bg-success-100 text-success-700"
              : "bg-secondary-100 text-secondary-700"
          }`}
        >
          {item.status}
        </span>
      ),
    },
    { key: "clicks", header: "Clicks" },
    { key: "conversions", header: "Conversions" },
    {
      key: "earnings",
      header: "Earnings",
      render: (item: Affiliate) => `$${item.earnings.toFixed(2)}`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Affiliate Partners</h1>
          <p className="text-secondary-500 mt-1">Manage affiliate partners and track performance</p>
        </div>
        <Link href="/admin/affiliates/new" className="btn btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Partner
        </Link>
      </div>

      <DataTable
        data={affiliates}
        columns={columns}
        searchPlaceholder="Search affiliates..."
        loading={isLoading}
      />
    </div>
  );
}
