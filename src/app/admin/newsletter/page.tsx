"use client";

import { useEffect, useState } from "react";
import { Mail, Download, Trash2 } from "lucide-react";
import DataTable from "@/components/admin/DataTable";

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  source: string | null;
  status: string;
  subscribedAt: string;
}

export default function NewsletterPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    try {
      const res = await fetch("/api/admin/newsletter");
      if (res.ok) {
        const data = await res.json();
        setSubscribers(data);
      }
    } catch (error) {
      console.error("Failed to fetch subscribers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    const csv = subscribers
      .filter((s) => s.status === "ACTIVE")
      .map((s) => `${s.email},${s.name || ""}`)
      .join("\n");
    const blob = new Blob([`email,name\n${csv}`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "subscribers.csv";
    a.click();
  };

  const columns = [
    { key: "email", header: "Email" },
    { key: "name", header: "Name" },
    { key: "source", header: "Source" },
    {
      key: "status",
      header: "Status",
      render: (item: Subscriber) => (
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
      key: "subscribedAt",
      header: "Subscribed",
      render: (item: Subscriber) => new Date(item.subscribedAt).toLocaleDateString(),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Newsletter</h1>
          <p className="text-secondary-500 mt-1">Manage email subscribers</p>
        </div>
        <button onClick={handleExport} className="btn btn-secondary">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </button>
      </div>

      <DataTable
        data={subscribers}
        columns={columns}
        searchPlaceholder="Search subscribers..."
        loading={isLoading}
      />
    </div>
  );
}
