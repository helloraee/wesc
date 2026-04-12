"use client";

import { useState } from "react";
import useSWR from "swr";
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
import { Plus, Pencil, Users, Trash2 } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type TeamRow = {
  id: string;
  name: string;
  sportId: string;
  type: string;
  gender: string | null;
  isActive: boolean;
  sport: { name: string };
  _count: { playingAthletes: number; practiceAthletes: number; sessions: number };
};

export default function TeamsPage() {
  const { data: sessionData } = useSession();
  const canDelete = ["SUPER_ADMIN", "ADMIN", "TEAM_MANAGER"].includes(
    sessionData?.user?.role ?? ""
  );
  const { data: sportsData } = useSWR("/api/sports", fetcher);
  const { data, mutate } = useSWR("/api/teams", fetcher);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TeamRow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<TeamRow | null>(null);
  const [form, setForm] = useState({
    name: "",
    sportId: "",
    type: "PLAYING",
    gender: "MALE",
  });

  function openCreate() {
    setEditing(null);
    setForm({ name: "", sportId: "", type: "PLAYING", gender: "MALE" });
    setOpen(true);
  }

  function openEdit(team: TeamRow) {
    setEditing(team);
    setForm({
      name: team.name,
      sportId: team.sportId,
      type: team.type,
      gender: team.gender || "MALE",
    });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      await fetch(`/api/teams/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setOpen(false);
    mutate();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/teams/${id}`, { method: "DELETE" });
    mutate();
  }

  const teams: TeamRow[] = data?.data ?? [];
  const sports = sportsData?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teams"
        description="Manage your club teams and rosters"
        actions={
          <Button onClick={openCreate}>
            <Plus className="mr-2 size-4" />
            Add Team
          </Button>
        }
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Team" : "Add Team"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Team Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. 1st Division Men's Handball"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Sport *</Label>
              <Select
                value={form.sportId}
                onValueChange={(v) => setForm({ ...form, sportId: v ?? "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sport">
                    {sports.find((s: { id: string; name: string }) => s.id === form.sportId)?.name ?? "Select sport"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {sports.map((s: { id: string; name: string }) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v ?? "PLAYING" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLAYING">Playing</SelectItem>
                    <SelectItem value="PRACTICE">Practice</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select
                  value={form.gender}
                  onValueChange={(v) => setForm({ ...form, gender: v ?? "MALE" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="MIXED">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" className="w-full">
              {editing ? "Update" : "Create"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="rounded-lg border border-border">
        <div className="hidden grid-cols-[1fr_auto_auto_auto_auto_auto] items-center gap-4 border-b border-border bg-muted/50 px-4 py-3 text-sm font-medium text-muted-foreground sm:grid">
          <span>Team</span>
          <span>Sport</span>
          <span>Type</span>
          <span>Athletes</span>
          <span>Sessions</span>
          <span>Actions</span>
        </div>
        {teams.map((team) => (
          <div
            key={team.id}
            className="grid grid-cols-1 gap-2 border-b border-border px-4 py-3 last:border-0 sm:grid-cols-[1fr_auto_auto_auto_auto_auto] sm:items-center sm:gap-4"
          >
            <div>
              <span className="font-medium">{team.name}</span>
              {team.gender && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {team.gender}
                </Badge>
              )}
              {!team.isActive && (
                <Badge variant="outline" className="ml-2 text-xs">
                  Inactive
                </Badge>
              )}
            </div>
            <span className="text-sm text-muted-foreground">{team.sport.name}</span>
            <Badge variant="outline" className="w-fit text-xs">{team.type}</Badge>
            <span className="text-sm text-muted-foreground">
              <Users className="mr-1 inline size-3.5" />
              {team._count.playingAthletes + team._count.practiceAthletes}
            </span>
            <span className="text-sm text-muted-foreground">
              {team._count.sessions}
            </span>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => openEdit(team)}>
                <Pencil className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                render={<Link href={`/back-office/teams/${team.id}`} />}
              >
                <Users className="size-4" />
              </Button>
              {canDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmDelete(team)}
                  className="text-muted-foreground hover:text-red-600"
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
        {teams.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No teams yet. Create your first team above.
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(open) => { if (!open) setConfirmDelete(null); }}
        title="Delete Team"
        description={`Are you sure you want to deactivate ${confirmDelete?.name ?? ""}? Athletes assigned to this team will be unaffected.`}
        actionLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          if (confirmDelete) {
            handleDelete(confirmDelete.id);
            setConfirmDelete(null);
          }
        }}
      />
    </div>
  );
}
