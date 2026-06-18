import { useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  LayoutDashboard, FileText, HardDrive, Zap, TrendingUp, Clock
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { PageHeader } from "@/shared/components/PageHeader";
import { Card, CardHeader, CardTitle } from "@/shared/components/Card";
import { Badge } from "@/shared/components/Badge";
import { Spinner } from "@/shared/components/Spinner";
import { useAnalyticsStore } from "@/shared/store/analyticsStore";
import { useHistoryStore } from "@/shared/store/historyStore";
import { getAnalyticsSummary, getRecentFiles } from "@/shared/utils/tauriCommands";
import { formatFileSize, operationLabel } from "@/shared/utils/formatUtils";

const COLORS = ["#f43f5e", "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#6366f1"];

export default function DashboardPage() {
  const { summary, isLoading, setSummary, setLoading, refreshKey } = useAnalyticsStore();
  const { setRecentFiles, recentFiles } = useHistoryStore();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getAnalyticsSummary(30),
      getRecentFiles(10),
    ])
      .then(([analytics, recent]) => {
        setSummary(analytics);
        setRecentFiles(recent);
      })
      .catch(() => {
        setSummary({
          totalOperations: 0,
          totalFilesProcessed: 0,
          totalStorageSaved: 0,
          mostUsedOperation: null,
          operationStats: [],
          dailyActivity: [],
        });
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const statCards = [
    {
      label: "Total Operations",
      value: summary?.totalOperations.toLocaleString() ?? "0",
      icon: Zap,
      color: "text-brand-400",
      bg: "bg-brand-600/20",
    },
    {
      label: "Files Processed",
      value: summary?.totalFilesProcessed.toLocaleString() ?? "0",
      icon: FileText,
      color: "text-blue-400",
      bg: "bg-blue-600/20",
    },
    {
      label: "Storage Saved",
      value: formatFileSize(summary?.totalStorageSaved ?? 0),
      icon: HardDrive,
      color: "text-emerald-400",
      bg: "bg-emerald-600/20",
    },
    {
      label: "Most Used Tool",
      value: summary?.mostUsedOperation
        ? operationLabel(summary.mostUsedOperation)
        : "—",
      icon: TrendingUp,
      color: "text-violet-400",
      bg: "bg-violet-600/20",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" label="Loading analytics..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={LayoutDashboard}
        title="Dashboard"
        description="Overview of your PDF processing activity"
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} padding="md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-secondary font-medium">{label}</p>
                <p className="mt-1.5 text-2xl font-bold text-primary">{value}</p>
              </div>
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${bg}`}>
                <Icon className={`h-4.5 w-4.5 ${color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Activity Chart */}
        <Card padding="md" className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Daily Activity (Last 30 Days)</CardTitle>
          </CardHeader>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={summary?.dailyActivity ?? []}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="date"
                tickFormatter={(v) => format(parseISO(v), "dd")}
                tick={{ fontSize: 11, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                labelFormatter={(v) => format(parseISO(v as string), "MMM dd, yyyy")}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#f43f5e"
                strokeWidth={2}
                fill="url(#colorCount)"
                name="Operations"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Operations Pie */}
        <Card padding="md">
          <CardHeader>
            <CardTitle>Tool Usage</CardTitle>
          </CardHeader>
          {(summary?.operationStats?.length ?? 0) > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={summary!.operationStats.slice(0, 6)}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="count"
                  nameKey="label"
                >
                  {summary!.operationStats.slice(0, 6).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-default)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(v) => <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[200px] items-center justify-center">
              <p className="text-sm text-muted">No data yet</p>
            </div>
          )}
        </Card>
      </div>

      {/* Operations Bar Chart */}
      {(summary?.operationStats?.length ?? 0) > 0 && (
        <Card padding="md">
          <CardHeader>
            <CardTitle>Operations Breakdown</CardTitle>
          </CardHeader>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={summary!.operationStats.slice(0, 8)} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="count" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Recent Files */}
      {recentFiles.length > 0 && (
        <Card padding="md">
          <CardHeader>
            <CardTitle>Recent Files</CardTitle>
          </CardHeader>
          <div className="space-y-1.5">
            {recentFiles.map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-[var(--bg-app-alt)] transition-colors"
              >
                <FileText className="h-4 w-4 text-brand-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-primary truncate">{f.name}</p>
                  <p className="text-xs text-muted">{operationLabel(f.operation)}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Clock className="h-3 w-3 text-muted" />
                  <span className="text-xs text-muted">
                    {format(parseISO(f.openedAt), "MMM dd")}
                  </span>
                </div>
                <Badge variant="brand" size="sm">{operationLabel(f.operation)}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
