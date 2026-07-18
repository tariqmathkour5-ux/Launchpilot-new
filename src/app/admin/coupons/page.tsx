"use client";

import { useEffect, useState } from "react";
import { Ticket, Plus, Percent, DollarSign } from "lucide-react";
import DataTable from "@/components/admin/DataTable";
import Link from "next/link";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount: number;
  discountType: string;
  usedCount: number;
  usageLimit: number | null;
  status: string;
  endDate: string;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const res = await fetch("/api/admin/coupons");
      if (res.ok) {
        const data = await res.json();
        setCoupons(data);
      }
    } catch (error) {
      console.error("Failed to fetch coupons:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    {
      key: "code",
      header: "Code",
      render: (item: Coupon) => (
        <span className="font-mono bg-secondary-100 px-2 py-1 rounded">{item.code}</span>
      ),
    },
    { key: "description", header: "Description" },
    {
      key: "discount",
      header: "Discount",
      render: (item: Coupon) => (
        <span className="font-medium">
          {item.discountType === "PERCENTAGE" ? (
            <>
              <Percent className="h-4 w-4 inline mr-1" />
              {item.discount}%
            </>
          ) : (
            <>
              <DollarSign className="h-4 w-4 inline mr-1" />
              {item.discount}
            </>
          )}
        </span>
      ),
    },
    {
      key: "usage",
      header: "Usage",
      render: (item: Coupon) =>
        item.usageLimit ? `${item.usedCount} / ${item.usageLimit}` : item.usedCount,
    },
    {
      key: "status",
      header: "Status",
      render: (item: Coupon) => (
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
    {
      key: "endDate",
      header: "Expires",
      render: (item: Coupon) => new Date(item.endDate).toLocaleDateString(),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Coupons</h1>
          <p className="text-secondary-500 mt-1">Manage discount codes and promotions</p>
        </div>
        <Link href="/admin/coupons/new" className="btn btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Create Coupon
        </Link>
      </div>

      <DataTable
        data={coupons}
        columns={columns}
        searchPlaceholder="Search coupons..."
        loading={isLoading}
      />
    </div>
  );
}
