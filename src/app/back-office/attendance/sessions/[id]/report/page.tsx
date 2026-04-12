"use client";

import useSWR from "swr";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Check,
  X,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Pencil,
} from "lucide-react";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type LogEntry = {
  athleteId: string;
  fullName: string;
  jerseyNumber: string | null;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  reason: string | null;
  markedBy: string;
  markedAt: string;
};

type UnmarkedAthlete = {
  id: string;
  fullName: string;
  jerseyNumber: string | null;
};

const STATUS_ICON: Record<string, typeof Check> = {
  PRESENT: Check,
  ABSENT: X,
  LATE: Clock,
  EXCUSED: ShieldCheck,
};

const STATUS_STYLE: Record<string, string> = {
  PRESENT: "text-green-600 bg-green-50",
  ABSENT: "text-red-600 bg-red-50",
  LATE: "text-yellow-600 bg-yellow-50",
  EXCUSED: "text-blue-600 bg-blue-50",
};

export default function SessionReportPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const { data } = useSWR(
    `/api/attendance/reports/session/${sessionId}`,
    fetcher
  );
  const report = data?.data;

  if (!report) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground">
        Loading report...
      </div>
    );
  }

  const { session, summary, logs, unmarkedAthletes } = report as {
    session: {
      id: string;
      title: string | null;
      location: string;
      scheduledAt: string;
      durationMinutes: number;
      status: string;
      createdBy: string;
      team: string;
      sport: string;
    };
    summary: {
      total: number;
      marked: number;
      present: number;
      late: number;
      absent: number;
      excused: number;
      unmarked: number;
      attendanceRate: number;
    };
    logs: LogEntry[];
    unmarkedAthletes: UnmarkedAthlete[];
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-1 size-4" />
          Back
        </Button>
        <Button
          variant="outline"
          size="sm"
          render={
            <Link
              href={`/back-office/attendance/sessions/${sessionId}`}
            />
          }
        >
          <Pencil className="mr-1 size-3.5" />
          Edit Attendance
        </Button>
      </div>

      <PageHeader
        title="Attendance Report"
        description={`${session.title || session.team} — ${session.sport}`}
      />

      {/* Session info */}
      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
        <span>
          <Calendar className="mr-1 inline size-3.5" />
          {format(new Date(session.scheduledAt), "EEEE, MMM d, yyyy 'at' h:mm a")}
        </span>
        <span>
          <MapPin className="mr-1 inline size-3.5" />
          {session.location}
        </span>
        <span>{session.durationMinutes} min</span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard
          label="Attendance Rate"
          value={`${summary.attendanceRate}%`}
          className="col-span-2 sm:col-span-1"
          highlight
        />
        <SummaryCard
          label="Present"
          value={summary.present}
          color="text-green-600"
        />
        <SummaryCard
          label="Late"
          value={summary.late}
          color="text-yellow-600"
        />
        <SummaryCard
          label="Absent"
          value={summary.absent + summary.excused}
          color="text-red-600"
          sub={summary.excused > 0 ? `(${summary.excused} excused)` : undefined}
        />
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex h-3 overflow-hidden rounded-full bg-muted">
          {summary.present > 0 && (
            <div
              className="bg-green-500 transition-all"
              style={{
                width: `${(summary.present / summary.total) * 100}%`,
              }}
            />
          )}
          {summary.late > 0 && (
            <div
              className="bg-yellow-500 transition-all"
              style={{
                width: `${(summary.late / summary.total) * 100}%`,
              }}
            />
          )}
          {summary.absent > 0 && (
            <div
              className="bg-red-500 transition-all"
              style={{
                width: `${(summary.absent / summary.total) * 100}%`,
              }}
            />
          )}
          {summary.excused > 0 && (
            <div
              className="bg-blue-500 transition-all"
              style={{
                width: `${(summary.excused / summary.total) * 100}%`,
              }}
            />
          )}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{summary.marked} of {summary.total} marked</span>
          <div className="flex gap-3">
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-green-500" /> Present
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-yellow-500" /> Late
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-red-500" /> Absent
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-blue-500" /> Excused
            </span>
          </div>
        </div>
      </div>

      {/* Attendance list */}
      <div className="divide-y divide-border rounded-lg border border-border bg-card">
        {logs.map((log, i) => {
          const Icon = STATUS_ICON[log.status];
          return (
            <motion.div
              key={log.athleteId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.015, duration: 0.15 }}
              className="flex items-center gap-3 px-4 py-2.5"
            >
              <div
                className={`flex size-8 shrink-0 items-center justify-center rounded-full ${STATUS_STYLE[log.status]}`}
              >
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {log.fullName}
                  {log.jerseyNumber && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      #{log.jerseyNumber}
                    </span>
                  )}
                </p>
                {log.reason && (
                  <p className="truncate text-xs text-muted-foreground">
                    Reason: {log.reason}
                  </p>
                )}
              </div>
              <span
                className={`shrink-0 text-xs font-medium ${STATUS_STYLE[log.status]} rounded-full px-2 py-0.5`}
              >
                {log.status}
              </span>
            </motion.div>
          );
        })}

        {/* Unmarked athletes */}
        {unmarkedAthletes.length > 0 &&
          unmarkedAthletes.map((a: UnmarkedAthlete) => (
            <div
              key={a.id}
              className="flex items-center gap-3 px-4 py-2.5 opacity-50"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <AlertTriangle className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {a.fullName}
                  {a.jerseyNumber && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      #{a.jerseyNumber}
                    </span>
                  )}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                NOT MARKED
              </span>
            </div>
          ))}

        {logs.length === 0 && unmarkedAthletes.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No attendance data for this session.
          </div>
        )}
      </div>

      {/* Footer info */}
      <p className="text-center text-xs text-muted-foreground">
        Session created by {session.createdBy} — Status: {session.status}
      </p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  color,
  highlight,
  className,
  sub,
}: {
  label: string;
  value: string | number;
  color?: string;
  highlight?: boolean;
  className?: string;
  sub?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-border p-3 ${highlight ? "bg-w-50" : "bg-card"} ${className ?? ""}`}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-xl font-bold ${color ?? "text-foreground"}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
