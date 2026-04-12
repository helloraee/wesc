"use client";

import { useSession } from "next-auth/react";
import { PageHeader } from "@/components/shared/PageHeader";

export default function DashboardPage() {
  const { data: session } = useSession();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${session?.user?.name?.split(" ")[0] ?? "Coach"}`}
        description="West End Sports Club back office"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Athletes" value="--" />
        <StatCard label="Teams" value="--" />
        <StatCard label="Sessions This Week" value="--" />
        <StatCard label="Avg. Attendance" value="--" />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-foreground">
        {value}
      </p>
    </div>
  );
}
