"use client";

import { PageHeader } from "@/components/shared/PageHeader";

export default function SessionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Sessions"
        description="Manage training sessions"
      />
      <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
        Coming soon
      </div>
    </div>
  );
}
