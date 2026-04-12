"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
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
  Save,
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
  { label: string; icon: typeof Check; activeClass: string; shortLabel: string }
> = {
  PRESENT: {
    label: "Present",
    shortLabel: "P",
    icon: Check,
    activeClass: "bg-green-500 text-white border-green-500",
  },
  LATE: {
    label: "Late",
    shortLabel: "L",
    icon: Clock,
    activeClass: "bg-yellow-500 text-white border-yellow-500",
  },
  ABSENT: {
    label: "Absent",
    shortLabel: "A",
    icon: X,
    activeClass: "bg-red-500 text-white border-red-500",
  },
  EXCUSED: {
    label: "Excused",
    shortLabel: "E",
    icon: ShieldCheck,
    activeClass: "bg-blue-500 text-white border-blue-500",
  },
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
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [expandedReason, setExpandedReason] = useState<string | null>(null);
  const [reasonText, setReasonText] = useState("");

  const practiceSession = sessionData?.data;
  const existingLogs: AttendanceLog[] = logsData?.data ?? [];

  const roster: AthleteInRoster[] =
    practiceSession?.team?.playingAthletes ?? [];

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
    setLocalStatuses((prev) => ({
      ...prev,
      [athleteId]: { status, reason: reason ?? null },
    }));

    setSavingId(athleteId);

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

    setSavingId(null);
    setSavedId(athleteId);
    setTimeout(() => setSavedId(null), 1500);

    mutateLogs();
  }

  async function markAllPresent() {
    for (const athlete of roster) {
      if (getStatus(athlete.id) !== "PRESENT") {
        await markAttendance(athlete.id, "PRESENT");
      }
    }
  }

  function handleReasonSubmit(athleteId: string) {
    markAttendance(athleteId, "ABSENT", reasonText);
    setExpandedReason(null);
    setReasonText("");
  }

  const marked = roster.filter((a) => getStatus(a.id)).length;
  const present = roster.filter(
    (a) => getStatus(a.id) === "PRESENT"
  ).length;
  const absent = roster.filter(
    (a) =>
      getStatus(a.id) === "ABSENT" || getStatus(a.id) === "EXCUSED"
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

      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
        <span>
          <Calendar className="mr-1 inline size-3.5" />
          {format(
            new Date(practiceSession.scheduledAt),
            "EEEE, MMM d 'at' h:mm a"
          )}
        </span>
        <span>
          <MapPin className="mr-1 inline size-3.5" />
          {practiceSession.location}
        </span>
        <span>{practiceSession.durationMinutes} min</span>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            {marked}/{roster.length} marked
          </span>
          <div className="flex gap-3 text-xs">
            <span className="text-green-600">{present} present</span>
            <span className="text-yellow-600">{late} late</span>
            <span className="text-red-600">{absent} absent</span>
          </div>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-green-500 transition-all duration-300"
            style={{
              width: `${roster.length > 0 ? (marked / roster.length) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      {/* Bulk action */}
      <Button variant="outline" className="w-full" onClick={markAllPresent}>
        <CheckCheck className="mr-2 size-4" />
        Mark All Present
      </Button>

      {/* Legend */}
      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
        {(["PRESENT", "LATE", "ABSENT", "EXCUSED"] as AttendanceStatus[]).map(
          (s) => {
            const Icon = STATUS_CONFIG[s].icon;
            return (
              <span key={s} className="flex items-center gap-0.5 px-2">
                <Icon className="size-3" />
                {STATUS_CONFIG[s].label}
              </span>
            );
          }
        )}
      </div>

      {/* Athlete list */}
      <div className="divide-y divide-border rounded-lg border border-border bg-card">
        {roster.map((athlete, i) => {
          const currentStatus = getStatus(athlete.id);
          const isSaving = savingId === athlete.id;
          const justSaved = savedId === athlete.id;

          return (
            <motion.div
              key={athlete.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.02, duration: 0.15 }}
            >
              <div className="flex items-center gap-3 px-3 py-2.5">
                {/* Jersey number circle */}
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-w-100 text-sm font-bold text-w-600">
                  {athlete.jerseyNumber || "—"}
                </div>

                {/* Name */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {athlete.fullName}
                  </p>
                </div>

                {/* Save indicator */}
                <AnimatePresence>
                  {(isSaving || justSaved) && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="text-xs text-green-600"
                    >
                      {isSaving ? (
                        <span className="animate-pulse">Saving...</span>
                      ) : (
                        <span className="flex items-center gap-0.5">
                          <Save className="size-3" />
                          Saved
                        </span>
                      )}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Status buttons — compact row */}
                <div className="flex shrink-0 gap-1">
                  {(
                    ["PRESENT", "LATE", "ABSENT", "EXCUSED"] as AttendanceStatus[]
                  ).map((status) => {
                    const config = STATUS_CONFIG[status];
                    const Icon = config.icon;
                    const isActive = currentStatus === status;

                    return (
                      <button
                        key={status}
                        title={config.label}
                        onClick={() => {
                          if (status === "ABSENT") {
                            setExpandedReason(
                              expandedReason === athlete.id
                                ? null
                                : athlete.id
                            );
                            setReasonText("");
                          } else {
                            setExpandedReason(null);
                          }
                          markAttendance(athlete.id, status);
                        }}
                        className={`flex size-9 items-center justify-center rounded-md border transition-all ${
                          isActive
                            ? config.activeClass
                            : "border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <Icon className="size-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Absence reason */}
              <AnimatePresence>
                {expandedReason === athlete.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-border bg-muted/30 px-3 py-2"
                  >
                    <div className="flex gap-2">
                      <Input
                        placeholder="Reason for absence (optional)"
                        value={reasonText}
                        onChange={(e) => setReasonText(e.target.value)}
                        className="h-8 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleReasonSubmit(athlete.id);
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={() => handleReasonSubmit(athlete.id)}
                      >
                        Save
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {roster.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No athletes assigned to this team yet. Add athletes to the team
            roster first.
          </div>
        )}
      </div>

      {/* Bottom save confirmation */}
      {marked > 0 && (
        <div className="rounded-lg bg-green-50 p-3 text-center text-sm text-green-700">
          <Check className="mr-1 inline size-4" />
          {marked} of {roster.length} attendance records saved
        </div>
      )}
    </div>
  );
}
