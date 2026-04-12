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
import { Plus, Pencil, Users } from "lucide-react";
import Link from "next/link";

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
  const { data: sportsData } = useSWR("/api/sports", fetcher);
  const { data, mutate } = useSWR("/api/teams", fetcher);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TeamRow | null>(null);
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => (
          <div
            key={team.id}
            className="rounded-lg border border-border bg-card p-5"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium">{team.name}</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {team.sport.name}
                </p>
              </div>
              <div className="flex gap-1">
                <Badge variant="outline" className="text-xs">
                  {team.type}
                </Badge>
                {team.gender && (
                  <Badge variant="secondary" className="text-xs">
                    {team.gender}
                  </Badge>
                )}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>
                <Users className="mr-1 inline size-3.5" />
                {team._count.playingAthletes + team._count.practiceAthletes}{" "}
                athletes
              </span>
              <span>{team._count.sessions} sessions</span>
            </div>
            <div className="mt-3 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(team)}>
                <Pencil className="mr-1 size-3" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                render={<Link href={`/back-office/teams/${team.id}`} />}
              >
                <Users className="mr-1 size-3" />
                Roster
              </Button>
            </div>
          </div>
        ))}
        {teams.length === 0 && (
          <div className="col-span-full rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
            No teams yet. Create your first team above.
          </div>
        )}
      </div>
    </div>
  );
}
