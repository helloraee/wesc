"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Check,
  X,
  Clock,
  ShieldCheck,
  ArrowLeft,
  CheckCheck,
  Calendar,
  MapPin,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

type AthleteInRoster = {
  id: string;
  fullName: string;
  jerseyNumber: string | null;
};

type AttendanceLog = {
  athleteId: string;
  status: AttendanceStatus;
  reason: string | null;
};

const STATUS_CONFIG: Record<
  AttendanceStatus,
  { label: string; icon: typeof Check; color: string; bg: string }
> = {
  PRESENT: { label: "Present", icon: Check, color: "text-green-700", bg: "bg-green-100 hover:bg-green-200 border-green-300" },
  ABSENT: { label: "Absent", icon: X, color: "text-red-700", bg: "bg-red-100 hover:bg-red-200 border-red-300" },
  LATE: { label: "Late", icon: Clock, color: "text-yellow-700", bg: "bg-yellow-100 hover:bg-yellow-200 border-yellow-300" },
  EXCUSED: { label: "Excused", icon: ShieldCheck, color: "text-blue-700", bg: "bg-blue-100 hover:bg-blue-200 border-blue-300" },
};

export default function AttendanceMarkingPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const { data: sessionData } = useSWR(`/api/sessions/${sessionId}`, fetcher);
  const { data: logsData, mutate: mutateLogs } = useSWR(
    `/api/attendance/${sessionId}`,
    fetcher
  );

  const [localStatuses, setLocalStatuses] = useState<
    Record<string, { status: AttendanceStatus; reason: string | null }>
  >({});
  const [expandedReason, setExpandedReason] = useState<string | null>(null);
  const [reasonText, setReasonText] = useState("");

  const practiceSession = sessionData?.data;
  const existingLogs: AttendanceLog[] = logsData?.data ?? [];

  // Build roster from team's playing athletes
  const roster: AthleteInRoster[] = practiceSession?.team?.playingAthletes ?? [];

  const getStatus = useCallback(
    (athleteId: string): AttendanceStatus | null => {
      if (localStatuses[athleteId]) return localStatuses[athleteId].status;
      const log = existingLogs.find((l) => l.athleteId === athleteId);
      return log?.status ?? null;
    },
    [localStatuses, existingLogs]
  );

  async function markAttendance(
    athleteId: string,
    status: AttendanceStatus,
    reason?: string | null
  ) {
    // Optimistic update
    setLocalStatuses((prev) => ({
      ...prev,
      [athleteId]: { status, reason: reason ?? null },
    }));

    // Auto-save immediately
    await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        athleteId,
        status,
        reason: reason ?? null,
      }),
    });

    mutateLogs();
  }

  async function markAllPresent() {
    const unmarked = roster.filter((a) => !getStatus(a.id));
    for (const athlete of unmarked) {
      await markAttendance(athlete.id, "PRESENT");
    }
    // Also mark any that weren't already marked
    const notPresent = roster.filter(
      (a) => getStatus(a.id) && getStatus(a.id) !== "PRESENT"
    );
    for (const athlete of notPresent) {
      await markAttendance(athlete.id, "PRESENT");
    }
  }

  function handleReasonSubmit(athleteId: string) {
    markAttendance(athleteId, "ABSENT", reasonText);
    setExpandedReason(null);
    setReasonText("");
  }

  // Stats
  const marked = roster.filter((a) => getStatus(a.id)).length;
  const present = roster.filter((a) => getStatus(a.id) === "PRESENT").length;
  const absent = roster.filter(
    (a) => getStatus(a.id) === "ABSENT" || getStatus(a.id) === "EXCUSED"
  ).length;
  const late = roster.filter((a) => getStatus(a.id) === "LATE").length;

  if (!practiceSession) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground">
        Loading session...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="mr-1 size-4" />
        Back
      </Button>

      <PageHeader
        title={practiceSession.title || practiceSession.team.name}
        description={practiceSession.team.sport.name}
      />

      {/* Session info */}
      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
        <span>
          <Calendar className="mr-1 inline size-3.5" />
          {format(new Date(practiceSession.scheduledAt), "EEEE, MMM d 'at' h:mm a")}
        </span>
        <span>
          <MapPin className="mr-1 inline size-3.5" />
          {practiceSession.location}
        </span>
        <span>{practiceSession.durationMinutes} min</span>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-2 rounded-lg bg-muted/50 p-3">
        <div className="text-center">
          <p className="text-lg font-bold">{marked}/{roster.length}</p>
          <p className="text-xs text-muted-foreground">Marked</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-green-600">{present}</p>
          <p className="text-xs text-muted-foreground">Present</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-red-600">{absent}</p>
          <p className="text-xs text-muted-foreground">Absent</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-yellow-600">{late}</p>
          <p className="text-xs text-muted-foreground">Late</p>
        </div>
      </div>

      {/* Bulk action */}
      <Button
        variant="outline"
        className="w-full"
        onClick={markAllPresent}
      >
        <CheckCheck className="mr-2 size-4" />
        Mark All Present
      </Button>

      {/* Athlete list */}
      <div className="space-y-2">
        {roster.map((athlete, i) => {
          const currentStatus = getStatus(athlete.id);

          return (
            <motion.div
              key={athlete.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.2 }}
              className="rounded-lg border border-border bg-card p-3"
            >
              <div className="flex items-center justify-between gap-3">
                {/* Athlete info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{athlete.fullName}</p>
                  {athlete.jerseyNumber && (
                    <p className="text-xs text-muted-foreground">
                      #{athlete.jerseyNumber}
                    </p>
                  )}
                </div>

                {/* Status indicator */}
                {currentStatus && (
                  <Badge
                    variant="outline"
                    className={`shrink-0 ${STATUS_CONFIG[currentStatus].bg} ${STATUS_CONFIG[currentStatus].color} border`}
                  >
                    {STATUS_CONFIG[currentStatus].label}
                  </Badge>
                )}
              </div>

              {/* Action buttons — large tap targets (min 44px) */}
              <div className="mt-2 grid grid-cols-4 gap-2">
                {(
                  ["PRESENT", "ABSENT", "LATE", "EXCUSED"] as AttendanceStatus[]
                ).map((status) => {
                  const config = STATUS_CONFIG[status];
                  const Icon = config.icon;
                  const isActive = currentStatus === status;

                  return (
                    <button
                      key={status}
                      onClick={() => {
                        if (status === "ABSENT") {
                          setExpandedReason(
                            expandedReason === athlete.id ? null : athlete.id
                          );
                          setReasonText("");
                          markAttendance(athlete.id, status);
                        } else {
                          setExpandedReason(null);
                          markAttendance(athlete.id, status);
                        }
                      }}
                      className={`flex min-h-[44px] flex-col items-center justify-center rounded-md border text-xs font-medium transition-colors ${
                        isActive
                          ? `${config.bg} ${config.color} border-current`
                          : "border-border bg-background text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <Icon className="mb-0.5 size-4" />
                      {config.label}
                    </button>
                  );
                })}
              </div>

              {/* Absence reason input */}
              {expandedReason === athlete.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="mt-2 flex gap-2"
                >
                  <Input
                    placeholder="Reason for absence (optional)"
                    value={reasonText}
                    onChange={(e) => setReasonText(e.target.value)}
                    className="text-sm"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReasonSubmit(athlete.id)}
                  >
                    Save
                  </Button>
                </motion.div>
              )}
            </motion.div>
          );
        })}

        {roster.length === 0 && (
          <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
            No athletes assigned to this team yet. Add athletes to the team first.
          </div>
        )}
      </div>
    </div>
  );
}
