"use client";

import { useState } from "react";
import useSWR from "swr";
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
import { Textarea } from "@/components/ui/textarea";
import { Plus, ClipboardCheck, Calendar, Trash2 } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type SessionRow = {
  id: string;
  title: string | null;
  location: string;
  scheduledAt: string;
  durationMinutes: number;
  status: string;
  team: { name: string; sport: { name: string } };
  _count: { attendanceLogs: number };
};

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function SessionsPage() {
  const { data: sessionData } = useSession();
  const canDelete = ["SUPER_ADMIN", "ADMIN", "TEAM_MANAGER"].includes(
    sessionData?.user?.role ?? ""
  );
  const { data: teamsData } = useSWR("/api/teams", fetcher);
  const { data, mutate } = useSWR("/api/sessions", fetcher);
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<SessionRow | null>(null);
  const [form, setForm] = useState({
    teamId: "",
    title: "",
    location: "",
    scheduledAt: "",
    durationMinutes: 90,
    notes: "",
  });
  const [error, setError] = useState("");

  function openCreate() {
    setForm({
      teamId: "",
      title: "",
      location: "",
      scheduledAt: "",
      durationMinutes: 90,
      notes: "",
    });
    setError("");
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        title: form.title || null,
        notes: form.notes || null,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      setError(err.error || "Something went wrong");
      return;
    }

    setOpen(false);
    mutate();
  }

  async function handleDeleteSession(id: string) {
    await fetch(`/api/sessions/${id}`, { method: "DELETE" });
    mutate();
  }

  const sessions: SessionRow[] = data?.data ?? [];
  const teams = teamsData?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sessions"
        description="Schedule and manage training sessions"
        actions={
          <Button onClick={openCreate}>
            <Plus className="mr-2 size-4" />
            New Session
          </Button>
        }
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Session</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Team *</Label>
              <Select
                value={form.teamId}
                onValueChange={(v) => setForm({ ...form, teamId: v ?? "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select team">
                    {(() => { const t = teams.find((t: { id: string; name: string; sport: { name: string } }) => t.id === form.teamId); return t ? `${t.name} (${t.sport.name})` : "Select team"; })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {teams.map((t: { id: string; name: string; sport: { name: string } }) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} ({t.sport.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title (optional)</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Pre-match drill"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Date & Time *</Label>
                <Input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(e) =>
                    setForm({ ...form, scheduledAt: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Duration (min)</Label>
                <Input
                  type="number"
                  value={form.durationMinutes}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      durationMinutes: parseInt(e.target.value) || 90,
                    })
                  }
                  min={15}
                  step={15}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Location *</Label>
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. Main Court"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Optional notes..."
                rows={2}
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full">
              Schedule Session
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="space-y-3">
        {sessions.map((s) => (
          <div
            key={s.id}
            className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">
                  {s.title || s.team.name}
                </h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[s.status] || ""}`}
                >
                  {s.status}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span>
                  <Calendar className="mr-1 inline size-3.5" />
                  {format(new Date(s.scheduledAt), "MMM d, yyyy 'at' h:mm a")}
                </span>
                <span>{s.durationMinutes} min</span>
                <span>{s.location}</span>
                <span>{s.team.sport.name} — {s.team.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {s._count.attendanceLogs > 0 && (
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <ClipboardCheck className="size-3.5" />
                  {s._count.attendanceLogs} marked
                </span>
              )}
              {s._count.attendanceLogs > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  render={<Link href={`/back-office/attendance/sessions/${s.id}/report`} />}
                >
                  Report
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                render={<Link href={`/back-office/attendance/sessions/${s.id}`} />}
              >
                {s._count.attendanceLogs > 0 ? "Edit" : "Mark"}
              </Button>
              {canDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmDelete(s)}
                  className="text-muted-foreground hover:text-red-600"
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
        {sessions.length === 0 && (
          <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
            No sessions scheduled. Create your first session above.
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(open) => { if (!open) setConfirmDelete(null); }}
        title="Delete Session"
        description={`Are you sure you want to delete "${confirmDelete?.title || confirmDelete?.team.name}"? Any attendance records for this session will also be removed.`}
        actionLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          if (confirmDelete) {
            handleDeleteSession(confirmDelete.id);
            setConfirmDelete(null);
          }
        }}
      />
    </div>
  );
}
