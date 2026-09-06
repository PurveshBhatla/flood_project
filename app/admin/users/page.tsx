'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Users, Shield, User, Trash2, CheckCircle2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [usersList, setUsersList] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setUsersList(data.users || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user && user.role === 'ADMIN') loadUsers();
  }, [user]);

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    try {
      await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });
      loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Permanently delete this user account?')) return;
    try {
      await fetch(`/api/admin/users?userId=${userId}`, { method: 'DELETE' });
      loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container mx-auto px-4 md:px-8 py-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-brand-600" /> User Directory & Role Control
          </h1>
          <p className="text-xs text-muted-foreground">Manage user accounts and administrator role assignments.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border uppercase font-semibold text-muted-foreground">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Locations</th>
                <th className="p-4">Joined</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {usersList.map((u) => (
                <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-bold text-foreground flex items-center gap-2">
                    <User className="h-4 w-4 text-brand-600" />
                    {u.name}
                  </td>
                  <td className="p-4 text-muted-foreground">{u.email}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                        u.role === 'ADMIN'
                          ? 'bg-amber-500/20 text-amber-600 border border-amber-500/30'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground">{u._count?.locations ?? 0} Saved</td>
                  <td className="p-4 text-muted-foreground">{formatDate(u.createdAt)}</td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => handleToggleRole(u.id, u.role)}
                      className="px-2.5 py-1 bg-muted hover:bg-muted/80 rounded-lg font-semibold text-[11px] transition-colors"
                    >
                      Toggle {u.role === 'ADMIN' ? 'User' : 'Admin'}
                    </button>
                    {u.id !== user?.id && (
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-1 text-muted-foreground hover:text-red-600 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
