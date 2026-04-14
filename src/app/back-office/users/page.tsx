"use client";

import { useState } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  _count: { managedTeams: number; coachedTeams: number };
};

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  TEAM_MANAGER: "Team Manager",
  COACH: "Coach",
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "bg-purple-100 text-purple-700",
  ADMIN: "bg-blue-100 text-blue-700",
  TEAM_MANAGER: "bg-green-100 text-green-700",
  COACH: "bg-gray-100 text-gray-700",
};

export default function UsersPage() {
  const { data: sessionData } = useSession();
  const { data, mutate } = useSWR("/api/users", fetcher);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "COACH",
  });
  const [error, setError] = useState("");
  const [confirmToggle, setConfirmToggle] = useState<UserRow | null>(null);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", email: "", password: "", role: "COACH" });
    setError("");
    setOpen(true);
  }

  function openEdit(user: UserRow) {
    setEditing(user);
    setForm({ name: user.name, email: user.email, password: "", role: user.role });
    setError("");
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (editing) {
      const body: Record<string, string> = { name: form.name, email: form.email, role: form.role };
      if (form.password) body.password = form.password;

      const res = await fetch(`/api/users/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Something went wrong");
        return;
      }
    } else {
      if (!form.password) {
        setError("Password is required for new users");
        return;
      }
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Something went wrong");
        return;
      }
    }

    setOpen(false);
    mutate();
  }

  async function handleDeleteUser(user: UserRow) {
    if (user.id === sessionData?.user?.id) return;
    await fetch(`/api/users/${user.id}`, { method: "DELETE" });
    mutate();
  }

  const users: UserRow[] = data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage users and assign roles"
        actions={
          <Button onClick={openCreate}>
            <Plus className="mr-2 size-4" />
            Add User
          </Button>
        }
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit User" : "Add User"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Username *</Label>
              <Input
                type="text"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value.trim() })}
                placeholder="e.g. ahmed"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{editing ? "New Password (leave blank to keep)" : "Password *"}</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={editing ? "Leave blank to keep current" : "Min 6 characters"}
                {...(!editing && { required: true, minLength: 6 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Role *</Label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm({ ...form, role: v ?? "COACH" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="TEAM_MANAGER">Team Manager</SelectItem>
                  <SelectItem value="COACH">Coach</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full">
              {editing ? "Update" : "Create User"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="rounded-lg border border-border">
        <div className="hidden grid-cols-[1fr_auto_auto_auto_auto] gap-4 border-b border-border bg-muted/50 px-4 py-3 text-sm font-medium text-muted-foreground sm:grid">
          <span>User</span>
          <span>Role</span>
          <span>Teams</span>
          <span>Joined</span>
          <span>Actions</span>
        </div>
        {users.map((user) => {
          const isSelf = user.id === sessionData?.user?.id;

          return (
            <div
              key={user.id}
              className="grid grid-cols-1 gap-2 border-b border-border px-4 py-3 last:border-0 sm:grid-cols-[1fr_auto_auto_auto_auto] sm:items-center sm:gap-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{user.name}</span>
                  {isSelf && (
                    <Badge variant="outline" className="text-xs">
                      You
                    </Badge>
                  )}
                  {!user.isActive && (
                    <Badge variant="secondary" className="text-xs">
                      Inactive
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <span
                className={`inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[user.role] || ""}`}
              >
                {ROLE_LABELS[user.role] || user.role}
              </span>
              <span className="text-sm text-muted-foreground">
                {user._count.managedTeams + user._count.coachedTeams}
              </span>
              <span className="text-sm text-muted-foreground">
                {format(new Date(user.createdAt), "MMM d, yyyy")}
              </span>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => openEdit(user)}>
                  <Pencil className="size-4" />
                </Button>
                {!isSelf && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmToggle(user)}
                    className="text-muted-foreground hover:text-red-600"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
        {users.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No users found.
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmToggle}
        onOpenChange={(open) => { if (!open) setConfirmToggle(null); }}
        title="Delete User"
        description={`Are you sure you want to permanently delete ${confirmToggle?.name ?? ""}? This will remove their account and all associated data.`}
        actionLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          if (confirmToggle) {
            handleDeleteUser(confirmToggle);
            setConfirmToggle(null);
          }
        }}
      />
    </div>
  );
}
