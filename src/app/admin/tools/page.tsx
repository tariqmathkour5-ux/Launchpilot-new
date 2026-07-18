"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Edit, Eye, Trash2 } from "lucide-react";

interface Tool {
  id: string;
  slug: string;
  name: string;
  published: boolean;
  category: { name: string };
  createdAt: string;
}

export default function AdminToolsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchTools();
  }, []);

  const fetchTools = async () => {
    try {
      const res = await fetch("/api/admin/tools");
      const data = await res.json();
      setTools(data.tools || []);
    } catch (error) {
      console.error("Failed to fetch tools:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tool?")) return;

    try {
      await fetch(`/api/admin/tools/${id}`, { method: "DELETE" });
      setTools(tools.filter((t) => t.id !== id));
    } catch (error) {
      console.error("Failed to delete tool:", error);
    }
  };

  const filteredTools = tools.filter(
    (tool) =>
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Tools</h1>
          <p className="text-secondary-500 mt-1">Manage AI tool listings</p>
        </div>
        <Link href="/admin/tools/new" className="btn btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Tool
        </Link>
      </div>

      <div className="card">
        <div className="p-4 border-b border-secondary-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tools..."
              className="input pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-secondary-50 border-b border-secondary-200">
                <th className="text-left p-4 font-medium text-secondary-600">Name</th>
                <th className="text-left p-4 font-medium text-secondary-600">Category</th>
                <th className="text-left p-4 font-medium text-secondary-600">Status</th>
                <th className="text-left p-4 font-medium text-secondary-600">Created</th>
                <th className="text-right p-4 font-medium text-secondary-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTools.map((tool) => (
                <tr key={tool.id} className="border-b border-secondary-100 hover:bg-secondary-50">
                  <td className="p-4">
                    <div>
                      <p className="font-medium text-secondary-900">{tool.name}</p>
                      <p className="text-sm text-secondary-500">{tool.slug}</p>
                    </div>
                  </td>
                  <td className="p-4 text-secondary-600">{tool.category?.name || "-"}</td>
                  <td className="p-4">
                    <span
                      className={`badge ${
                        tool.published ? "badge-success" : "badge-secondary"
                      }`}
                    >
                      {tool.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="p-4 text-secondary-500 text-sm">
                    {new Date(tool.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/tools/${tool.slug}`}
                        className="p-2 rounded-lg hover:bg-secondary-100 text-secondary-600"
                        target="_blank"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/admin/tools/${tool.id}`}
                        className="p-2 rounded-lg hover:bg-primary-100 text-primary-600"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(tool.id)}
                        className="p-2 rounded-lg hover:bg-error-100 text-error-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
