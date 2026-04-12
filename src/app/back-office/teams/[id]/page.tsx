"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, X, Search, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Athlete = {
  id: string;
  fullName: string;
  jerseyNumber: string | null;
  gender: string;
  isActive: boolean;
};

export default function TeamRosterPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.id as string;

  const { data: teamData, mutate: mutateTeam } = useSWR(
    `/api/teams/${teamId}`,
    fetcher
  );
  const team = teamData?.data;

  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Fetch all athletes for the same sport to add to roster
  const { data: allAthletesData } = useSWR(
    team ? `/api/athletes?sportId=${team.sportId}` : null,
    fetcher
  );

  const roster: Athlete[] = team?.playingAthletes ?? [];
  const rosterIds = new Set(roster.map((a: Athlete) => a.id));

  const availableAthletes: Athlete[] = (allAthletesData?.data ?? []).filter(
    (a: Athlete) =>
      a.isActive &&
      !rosterIds.has(a.id) &&
      a.fullName.toLowerCase().includes(search.toLowerCase())
  );

  async function addToRoster(athleteId: string) {
    await fetch(`/api/athletes/${athleteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playingTeamId: teamId }),
    });
    mutateTeam();
  }

  async function removeFromRoster(athleteId: string) {
    await fetch(`/api/athletes/${athleteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playingTeamId: null }),
    });
    mutateTeam();
  }

  if (!team) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground">
        Loading team...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="mr-1 size-4" />
        Back to Teams
      </Button>

      <PageHeader
        title={team.name}
        description={`${team.sport.name} — ${team.type} team roster`}
        actions={
          <Button onClick={() => { setSearch(""); setAddOpen(true); }}>
            <Plus className="mr-2 size-4" />
            Add Athletes
          </Button>
        }
      />

      {/* Roster stats */}
      <div className="flex items-center gap-4 rounded-lg bg-muted/50 p-4">
        <Users className="size-5 text-muted-foreground" />
        <span className="text-sm font-medium">
          {roster.length} athlete{roster.length !== 1 ? "s" : ""} on roster
        </span>
        {team.gender && (
          <Badge variant="outline">{team.gender}</Badge>
        )}
        <Badge variant="secondary">{team.type}</Badge>
      </div>

      {/* Add athletes dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Athletes to {team.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search athletes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>
            <div className="max-h-72 space-y-1 overflow-y-auto">
              {availableAthletes.map((athlete) => (
                <button
                  key={athlete.id}
                  onClick={() => addToRoster(athlete.id)}
                  className="flex w-full items-center justify-between rounded-md p-3 text-left transition-colors hover:bg-muted"
                >
                  <div>
                    <span className="font-medium">{athlete.fullName}</span>
                    {athlete.jerseyNumber && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        #{athlete.jerseyNumber}
                      </span>
                    )}
                  </div>
                  <Plus className="size-4 text-muted-foreground" />
                </button>
              ))}
              {availableAthletes.length === 0 && (
                <p className="p-4 text-center text-sm text-muted-foreground">
                  {search
                    ? "No matching athletes found"
                    : "All athletes are already on this roster"}
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Roster list */}
      <div className="space-y-2">
        {roster.map((athlete: Athlete, i: number) => (
          <motion.div
            key={athlete.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03, duration: 0.2 }}
            className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-full bg-w-100 text-sm font-bold text-w-600">
                {athlete.jerseyNumber || "—"}
              </div>
              <div>
                <p className="font-medium">{athlete.fullName}</p>
                <p className="text-xs text-muted-foreground">{athlete.gender}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeFromRoster(athlete.id)}
              className="text-muted-foreground hover:text-red-600"
            >
              <X className="size-4" />
            </Button>
          </motion.div>
        ))}
        {roster.length === 0 && (
          <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
            No athletes on this roster yet. Click &quot;Add Athletes&quot; to build your team.
          </div>
        )}
      </div>
    </div>
  );
}
