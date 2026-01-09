import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function WidgetSkeleton() {
  return (
    <Card className="border-slate-700 bg-slate-800/50 backdrop-blur h-full w-full overflow-hidden flex flex-col">
      <CardHeader className="p-3 pb-2 shrink-0">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24 bg-slate-700" />
          <Skeleton className="h-4 w-4 bg-slate-700" />
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0 flex-1 min-h-0 space-y-2">
        <Skeleton className="h-12 w-full bg-slate-700" />
        <Skeleton className="h-12 w-full bg-slate-700" />
        <Skeleton className="h-12 w-full bg-slate-700" />
      </CardContent>
    </Card>
  );
}