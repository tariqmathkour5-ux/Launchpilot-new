"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shield, Plus, Edit } from "lucide-react";
import DataTable from "@/components/admin/DataTable";

interface Role {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  level: number;
  isSystem: boolean;
  _count?: { users: number };
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const res = await fetch("/api/admin/roles");
      if (res.ok) {
        const data = await res.json();
        setRoles(data);
      }
    } catch (error) {
      console.error("Failed to fetch roles:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    { key: "name", header: "Name" },
    { key: "slug", header: "Slug" },
    {
      key: "level",
      header: "Level",
      render: (item: Role) => (
        <span className="px-2 py-1 text-xs bg-secondary-100 text-secondary-700 rounded-full">
          {item.level}
        </span>
      ),
    },
    {
      key: "isSystem",
      header: "System Role",
      render: (item: Role) =>
        item.isSystem ? (
          <span className="text-success-600 text-sm">Yes</span>
        ) : (
          <span className="text-secondary-400 text-sm">No</span>
        ),
    },
    {
      key: "description",
      header: "Description",
      render: (item: Role) => item.description || "-",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Roles & Permissions</h1>
          <p className="text-secondary-500 mt-1">Manage user roles and access permissions</p>
        </div>
        <Link href="/admin/roles/new" className="btn btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Role
        </Link>
      </div>

      <DataTable
        data={roles}
        columns={columns}
        searchPlaceholder="Search roles..."
        loading={isLoading}
        actions={(item) => (
          <Link
            href={`/admin/roles/${item.id}`}
            className="text-primary-600 hover:text-primary-700"
          >
            <Edit className="h-4 w-4" />
          </Link>
        )}
      />
    </div>
  );
}
