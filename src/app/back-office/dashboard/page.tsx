"use client";

import { useSession } from "next-auth/react";
import useSWR from "swr";
import { format } from "date-fns";
import { motion } from "framer-motion";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Shield, Calendar, TrendingUp, ClipboardCheck } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type TodaySession = {
  id: string;
  title: string | null;
  scheduledAt: string;
  location: string;
  team: { name: string; sport: { name: string } };
  _count: { attendanceLogs: number };
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const { data } = useSWR("/api/dashboard", fetcher);

  const stats = data?.data;
  const todaySessions: TodaySession[] = stats?.todaySessions ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${session?.user?.name?.split(" ")[0] ?? "Coach"}`}
        description="West End Sports Club back office"
      />

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Athletes"
          value={stats?.athleteCount ?? "—"}
          icon={<Users className="size-5 text-w-400" />}
        />
        <StatCard
          label="Teams"
          value={stats?.teamCount ?? "—"}
          icon={<Shield className="size-5 text-w-400" />}
        />
        <StatCard
          label="Sessions This Week"
          value={stats?.sessionsThisWeek ?? "—"}
          icon={<Calendar className="size-5 text-w-400" />}
        />
        <StatCard
          label="Avg. Attendance"
          value={stats ? `${stats.avgAttendance}%` : "—"}
          icon={<TrendingUp className="size-5 text-w-400" />}
        />
      </div>

      {/* Today's sessions */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">
            Today&apos;s Sessions
          </h2>
          <Button variant="outline" size="sm" render={<Link href="/back-office/attendance/sessions" />}>
            View All
          </Button>
        </div>

        {todaySessions.length > 0 ? (
          <div className="space-y-2">
            {todaySessions.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.25 }}
              >
                <Link
                  href={`/back-office/attendance/sessions/${s.id}`}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/50"
                >
                  <div>
                    <h3 className="font-medium">{s.title || s.team.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(s.scheduledAt), "h:mm a")} — {s.location} — {s.team.sport.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {s._count.attendanceLogs} marked
                    </Badge>
                    <ClipboardCheck className="size-5 text-primary" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card p-6 text-center text-muted-foreground">
            No sessions scheduled for today.
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid gap-3 sm:grid-cols-3">
        <QuickLink
          href="/back-office/athletes"
          label="Manage Athletes"
          description="Add, edit, and search athletes"
        />
        <QuickLink
          href="/back-office/teams"
          label="Manage Teams"
          description="Create teams and assign rosters"
        />
        <QuickLink
          href="/back-office/attendance/sessions"
          label="Schedule Sessions"
          description="Create and manage training sessions"
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-lg border border-border bg-card p-5"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        {icon}
      </div>
      <p className="mt-2 font-display text-2xl font-bold text-foreground">
        {value}
      </p>
    </motion.div>
  );
}

function QuickLink({
  href,
  label,
  description,
}: {
  href: string;
  label: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/50"
    >
      <h3 className="font-medium">{label}</h3>
      <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
    </Link>
  );
}
