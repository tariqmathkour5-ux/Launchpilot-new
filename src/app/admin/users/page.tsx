"use client";

import { useEffect, useState } from "react";
import { Shield, User as UserIcon, Edit } from "lucide-react";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-error-100 text-error-700";
      case "EDITOR":
        return "bg-warning-100 text-warning-700";
      default:
        return "bg-secondary-100 text-secondary-700";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Shield className="h-3 w-3" />;
      case "EDITOR":
        return <Edit className="h-3 w-3" />;
      default:
        return <UserIcon className="h-3 w-3" />;
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-secondary-900">Users</h1>
        <p className="text-secondary-500 mt-1">Manage user roles and permissions</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : (
        <div className="card">
          <table className="w-full">
            <thead>
              <tr className="bg-secondary-50 border-b border-secondary-200">
                <th className="text-left p-4 font-medium text-secondary-600">User</th>
                <th className="text-left p-4 font-medium text-secondary-600">Role</th>
                <th className="text-left p-4 font-medium text-secondary-600">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-secondary-100 hover:bg-secondary-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
                        {user.name?.charAt(0) || "U"}
                      </div>
                      <div>
                        <p className="font-medium text-secondary-900">{user.name || "No name"}</p>
                        <p className="text-sm text-secondary-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium ${getRoleBadgeClass(user.role)}`}>
                      {getRoleIcon(user.role)}
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4 text-secondary-500 text-sm">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
