"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Star, CheckCircle, Trash2 } from "lucide-react";
import DataTable from "@/components/admin/DataTable";

interface UserReview {
  id: string;
  rating: number;
  title: string | null;
  content: string;
  verified: boolean;
  helpful: number;
  createdAt: string;
  tool: { name: string } | null;
  user: { name: string | null } | null;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await fetch("/api/admin/reviews");
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (id: string, verify: boolean) => {
    await fetch(`/api/admin/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verified: verify }),
    });
    fetchReviews();
  };

  const columns = [
    {
      key: "title",
      header: "Title",
      render: (item: UserReview) => item.title || "No title",
    },
    {
      key: "tool",
      header: "Tool",
      render: (item: UserReview) => item.tool?.name || "-",
    },
    {
      key: "rating",
      header: "Rating",
      render: (item: UserReview) => (
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 fill-warning-500 text-warning-500" />
          <span>{item.rating.toFixed(1)}</span>
        </div>
      ),
    },
    {
      key: "user",
      header: "Author",
      render: (item: UserReview) => item.user?.name || "Anonymous",
    },
    {
      key: "verified",
      header: "Verified",
      render: (item: UserReview) =>
        item.verified ? (
          <CheckCircle className="h-5 w-5 text-success-500" />
        ) : (
          <span className="text-secondary-400 text-sm">Pending</span>
        ),
    },
    {
      key: "helpful",
      header: "Helpful",
      render: (item: UserReview) => item.helpful,
    },
    {
      key: "createdAt",
      header: "Date",
      render: (item: UserReview) => new Date(item.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">User Reviews</h1>
        <p className="text-secondary-500 mt-1">Moderate and manage user reviews</p>
      </div>

      <DataTable
        data={reviews}
        columns={columns}
        searchPlaceholder="Search reviews..."
        loading={isLoading}
        actions={(item) => (
          <div className="flex items-center gap-2">
            {!item.verified && (
              <button
                onClick={() => handleVerify(item.id, true)}
                className="text-success-600 hover:text-success-700"
                title="Verify"
              >
                <CheckCircle className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      />
    </div>
  );
}
