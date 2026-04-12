"use client";

import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AthleteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data } = useSWR(`/api/athletes/${params.id}`, fetcher);
  const athlete = data?.data;

  if (!athlete) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground">
        Loading athlete...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="mr-1 size-4" />
        Back
      </Button>

      <PageHeader title={athlete.fullName} description={athlete.sport.name} />

      <div className="grid gap-4 sm:grid-cols-2">
        <InfoCard label="ID Card" value={athlete.idCardNumber} />
        <InfoCard label="Jersey" value={athlete.jerseyNumber || "—"} />
        <InfoCard label="Gender" value={athlete.gender} />
        <InfoCard label="Contact" value={athlete.contactNumber || "—"} />
        <InfoCard label="Sport" value={athlete.sport.name} />
        <InfoCard
          label="Playing Team"
          value={athlete.playingTeam?.name || "Unassigned"}
        />
      </div>

      {athlete.practiceTeams?.length > 0 && (
        <div>
          <h3 className="mb-2 font-display text-lg font-semibold">Practice Teams</h3>
          <div className="flex flex-wrap gap-2">
            {athlete.practiceTeams.map((pt: { team: { id: string; name: string } }) => (
              <Badge key={pt.team.id} variant="secondary">
                {pt.team.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Badge variant={athlete.isActive ? "default" : "secondary"}>
          {athlete.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
