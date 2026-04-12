"use client";

import useSWR from "swr";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, Calendar } from "lucide-react";
import Link from "next/link";

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

export default function AttendancePage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString();
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const { data: todaySessions } = useSWR(
    `/api/sessions?from=${todayStr}&to=${endOfDay.toISOString()}`,
    fetcher
  );
  const { data: recentSessions } = useSWR("/api/sessions", fetcher);

  const todayList: SessionRow[] = todaySessions?.data ?? [];
  const allSessions: SessionRow[] = recentSessions?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description="Mark attendance and view session history"
        actions={
          <Button render={<Link href="/back-office/attendance/sessions" />}>
            View All Sessions
          </Button>
        }
      />

      {/* Today's sessions */}
      <div>
        <h2 className="mb-3 font-display text-lg font-semibold">
          Today&apos;s Sessions
        </h2>
        {todayList.length > 0 ? (
          <div className="space-y-2">
            {todayList.map((s) => (
              <Link
                key={s.id}
                href={`/back-office/attendance/sessions/${s.id}`}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/50"
              >
                <div>
                  <h3 className="font-medium">
                    {s.title || s.team.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(s.scheduledAt), "h:mm a")} — {s.location} — {s.team.sport.name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{s._count.attendanceLogs} marked</Badge>
                  <ClipboardCheck className="size-5 text-primary" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card p-6 text-center text-muted-foreground">
            No sessions scheduled for today.
          </div>
        )}
      </div>

      {/* Recent sessions */}
      <div>
        <h2 className="mb-3 font-display text-lg font-semibold">
          Recent Sessions
        </h2>
        <div className="space-y-2">
          {allSessions.slice(0, 10).map((s) => (
            <Link
              key={s.id}
              href={`/back-office/attendance/sessions/${s.id}`}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/50"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{s.title || s.team.name}</h3>
                  <span className="text-xs text-muted-foreground">
                    {s.team.sport.name}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  <Calendar className="mr-1 inline size-3" />
                  {format(new Date(s.scheduledAt), "MMM d, yyyy 'at' h:mm a")} — {s.location}
                </p>
              </div>
              <Badge variant="outline">{s._count.attendanceLogs} marked</Badge>
            </Link>
          ))}
          {allSessions.length === 0 && (
            <div className="rounded-lg border border-border bg-card p-6 text-center text-muted-foreground">
              No sessions yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
