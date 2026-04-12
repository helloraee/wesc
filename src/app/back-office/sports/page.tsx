"use client";

import { PageHeader } from "@/components/shared/PageHeader";

export default function SportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Sports"
        description="Manage sports categories"
      />
      <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
        Coming soon
      </div>
    </div>
  );
}
