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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function SportsPage() {
  const { data, mutate } = useSWR("/api/sports", fetcher);
  const [open, setOpen] = useState(false);
  const [editingSport, setEditingSport] = useState<{ id: string; name: string; slug: string } | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  function openCreate() {
    setEditingSport(null);
    setName("");
    setSlug("");
    setOpen(true);
  }

  function openEdit(sport: { id: string; name: string; slug: string }) {
    setEditingSport(sport);
    setName(sport.name);
    setSlug(sport.slug);
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingSport) {
      await fetch(`/api/sports/${editingSport.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug }),
      });
    } else {
      await fetch("/api/sports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug }),
      });
    }
    setOpen(false);
    mutate();
  }

  async function toggleActive(id: string, isActive: boolean) {
    await fetch(`/api/sports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    mutate();
  }

  const sports = data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sports"
        description="Manage sport categories for your club"
        actions={
          <Button onClick={openCreate}>
            <Plus className="mr-2 size-4" />
            Add Sport
          </Button>
        }
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSport ? "Edit Sport" : "Add Sport"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!editingSport) {
                    setSlug(
                      e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
                    );
                  }
                }}
                placeholder="e.g. Handball"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. handball"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              {editingSport ? "Update" : "Create"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="rounded-lg border border-border">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 border-b border-border bg-muted/50 px-4 py-3 text-sm font-medium text-muted-foreground">
          <span>Sport</span>
          <span>Teams</span>
          <span>Athletes</span>
          <span>Actions</span>
        </div>
        {sports.map((sport: { id: string; name: string; slug: string; isActive: boolean; _count: { teams: number; athletes: number } }) => (
          <div
            key={sport.id}
            className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 border-b border-border px-4 py-3 last:border-0"
          >
            <div className="flex items-center gap-2">
              <span className="font-medium">{sport.name}</span>
              {!sport.isActive && (
                <Badge variant="secondary" className="text-xs">
                  Inactive
                </Badge>
              )}
            </div>
            <span className="text-sm text-muted-foreground">
              {sport._count.teams}
            </span>
            <span className="text-sm text-muted-foreground">
              {sport._count.athletes}
            </span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openEdit(sport)}
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleActive(sport.id, sport.isActive)}
              >
                {sport.isActive ? "Deactivate" : "Activate"}
              </Button>
            </div>
          </div>
        ))}
        {sports.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No sports yet. Add your first sport above.
          </div>
        )}
      </div>
    </div>
  );
}
