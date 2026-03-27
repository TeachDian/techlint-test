import { Card, CardContent, CardHeader } from "@client/components/ui/card";

const stats = [
  {
    key: "total",
    label: "Total tasks",
  },
  {
    key: "soon",
    label: "Due soon",
  },
  {
    key: "overdue",
    label: "Overdue",
  },
] as const;

type BoardStatsProps = {
  totalTaskCount: number;
  dueSoonCount: number;
  overdueCount: number;
};

export function BoardStats({ totalTaskCount, dueSoonCount, overdueCount }: BoardStatsProps) {
  const values = {
    total: totalTaskCount,
    soon: dueSoonCount,
    overdue: overdueCount,
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.key} className="shadow-sm">
          <CardHeader className="pb-2">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight text-foreground">{values[stat.key]}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
