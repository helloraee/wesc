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
import { Plus, Pencil, Search, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type AthleteRow = {
  id: string;
  fullName: string;
  idCardNumber: string;
  jerseyNumber: string | null;
  gender: string;
  contactNumber: string | null;
  sportId: string;
  playingTeamId: string | null;
  isActive: boolean;
  sport: { name: string };
  playingTeam: { name: string } | null;
};

export default function AthletesPage() {
  const { data: sessionData } = useSession();
  const canDelete = ["SUPER_ADMIN", "ADMIN", "TEAM_MANAGER"].includes(
    sessionData?.user?.role ?? ""
  );
  const [search, setSearch] = useState("");
  const [sportFilter, setSportFilter] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<AthleteRow | null>(null);
  const { data: sportsData } = useSWR("/api/sports", fetcher);

  const queryParams = new URLSearchParams();
  if (search) queryParams.set("search", search);
  if (sportFilter) queryParams.set("sportId", sportFilter);

  const { data, mutate } = useSWR(
    `/api/athletes?${queryParams.toString()}`,
    fetcher
  );

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AthleteRow | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    idCardNumber: "",
    jerseyNumber: "",
    gender: "MALE",
    contactNumber: "",
    sportId: "",
    playingTeamId: "",
  });
  const [error, setError] = useState("");

  // Fetch teams for selected sport
  const { data: teamsData } = useSWR(
    form.sportId ? `/api/teams?sportId=${form.sportId}` : null,
    fetcher
  );

  function openCreate() {
    setEditing(null);
    setForm({
      fullName: "",
      idCardNumber: "",
      jerseyNumber: "",
      gender: "MALE",
      contactNumber: "",
      sportId: "",
      playingTeamId: "",
    });
    setError("");
    setOpen(true);
  }

  function openEdit(athlete: AthleteRow) {
    setEditing(athlete);
    setForm({
      fullName: athlete.fullName,
      idCardNumber: athlete.idCardNumber,
      jerseyNumber: athlete.jerseyNumber || "",
      gender: athlete.gender,
      contactNumber: athlete.contactNumber || "",
      sportId: athlete.sportId,
      playingTeamId: athlete.playingTeamId || "",
    });
    setError("");
    setOpen(true);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/athletes/${id}`, { method: "DELETE" });
    mutate();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const body = {
      ...form,
      jerseyNumber: form.jerseyNumber || null,
      contactNumber: form.contactNumber || null,
      playingTeamId: form.playingTeamId || null,
    };

    const res = editing
      ? await fetch(`/api/athletes/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      : await fetch("/api/athletes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

    if (!res.ok) {
      const err = await res.json();
      setError(err.error || "Something went wrong");
      return;
    }

    setOpen(false);
    mutate();
  }

  const athletes: AthleteRow[] = data?.data ?? [];
  const sports = sportsData?.data ?? [];
  const teams = teamsData?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Athletes"
        description="Manage your club athletes"
        actions={
          <Button onClick={openCreate}>
            <Plus className="mr-2 size-4" />
            Add Athlete
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or ID card..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={sportFilter} onValueChange={(v) => setSportFilter(v ?? "")}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Sports">
              {sports.find((s: { id: string; name: string }) => s.id === sportFilter)?.name ?? "All Sports"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sports</SelectItem>
            {sports.map((s: { id: string; name: string }) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Athlete" : "Add Athlete"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                required
              />
            </div>
            {!editing && (
              <div className="space-y-2">
                <Label>ID Card Number *</Label>
                <Input
                  value={form.idCardNumber}
                  onChange={(e) =>
                    setForm({ ...form, idCardNumber: e.target.value })
                  }
                  required
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Jersey #</Label>
                <Input
                  value={form.jerseyNumber}
                  onChange={(e) =>
                    setForm({ ...form, jerseyNumber: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Gender *</Label>
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
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Contact Number</Label>
              <Input
                value={form.contactNumber}
                onChange={(e) =>
                  setForm({ ...form, contactNumber: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Sport *</Label>
              <Select
                value={form.sportId}
                onValueChange={(v) =>
                  setForm({ ...form, sportId: v ?? "", playingTeamId: "" })
                }
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
            {form.sportId && teams.length > 0 && (
              <div className="space-y-2">
                <Label>Playing Team</Label>
                <Select
                  value={form.playingTeamId}
                  onValueChange={(v) =>
                    setForm({ ...form, playingTeamId: v ?? "" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No team assigned">
                      {teams.find((t: { id: string; name: string }) => t.id === form.playingTeamId)?.name ?? "No team assigned"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No team</SelectItem>
                    {teams
                      .filter((t: { type: string }) => t.type === "PLAYING")
                      .map((t: { id: string; name: string }) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full">
              {editing ? "Update" : "Create"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Table */}
      <div className="rounded-lg border border-border">
        <div className="hidden grid-cols-[1fr_auto_auto_auto_auto] gap-4 border-b border-border bg-muted/50 px-4 py-3 text-sm font-medium text-muted-foreground sm:grid">
          <span>Name</span>
          <span>Sport</span>
          <span>Team</span>
          <span>Gender</span>
          <span>Actions</span>
        </div>
        {athletes.map((a) => (
          <div
            key={a.id}
            className="grid grid-cols-1 gap-2 border-b border-border px-4 py-3 last:border-0 sm:grid-cols-[1fr_auto_auto_auto_auto] sm:items-center sm:gap-4"
          >
            <div>
              <span className="font-medium">{a.fullName}</span>
              {a.jerseyNumber && (
                <span className="ml-2 text-xs text-muted-foreground">
                  #{a.jerseyNumber}
                </span>
              )}
              {!a.isActive && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  Inactive
                </Badge>
              )}
            </div>
            <span className="text-sm text-muted-foreground">
              {a.sport.name}
            </span>
            <span className="text-sm text-muted-foreground">
              {a.playingTeam?.name || "—"}
            </span>
            <Badge variant="outline" className="w-fit text-xs">
              {a.gender}
            </Badge>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => openEdit(a)}>
                <Pencil className="size-4" />
              </Button>
              {canDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmDelete(a)}
                  className="text-muted-foreground hover:text-red-600"
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
        {athletes.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No athletes found. Add your first athlete above.
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(open) => { if (!open) setConfirmDelete(null); }}
        title="Delete Athlete"
        description={`Are you sure you want to deactivate ${confirmDelete?.fullName ?? ""}? This will remove them from active rosters.`}
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
