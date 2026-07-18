"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Edit, Building2, CheckCircle, XCircle } from "lucide-react";
import DataTable from "@/components/admin/DataTable";

interface Company {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  industry: string | null;
  status: string;
  verified: boolean;
  createdAt: string;
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await fetch("/api/admin/companies");
      if (res.ok) {
        const data = await res.json();
        setCompanies(data);
      }
    } catch (error) {
      console.error("Failed to fetch companies:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    { key: "name", header: "Name" },
    {
      key: "industry",
      header: "Industry",
      render: (item: Company) => item.industry || "-",
    },
    {
      key: "status",
      header: "Status",
      render: (item: Company) => (
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            item.status === "ACTIVE"
              ? "bg-success-100 text-success-700"
              : item.status === "PENDING"
              ? "bg-warning-100 text-warning-700"
              : "bg-error-100 text-error-700"
          }`}
        >
          {item.status}
        </span>
      ),
    },
    {
      key: "verified",
      header: "Verified",
      render: (item: Company) =>
        item.verified ? (
          <CheckCircle className="h-5 w-5 text-success-500" />
        ) : (
          <XCircle className="h-5 w-5 text-secondary-300" />
        ),
    },
    {
      key: "createdAt",
      header: "Created",
      render: (item: Company) => new Date(item.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Companies</h1>
          <p className="text-secondary-500 mt-1">Manage tool vendors and companies</p>
        </div>
        <Link href="/admin/companies/new" className="btn btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Company
        </Link>
      </div>

      <DataTable
        data={companies}
        columns={columns}
        searchPlaceholder="Search companies..."
        loading={isLoading}
        actions={(item) => (
          <Link
            href={`/admin/companies/${item.id}`}
            className="text-primary-600 hover:text-primary-700"
          >
            <Edit className="h-4 w-4" />
          </Link>
        )}
      />
    </div>
  );
}
