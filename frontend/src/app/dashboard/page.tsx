"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Server, Globe, FileText, Activity, TrendingUp, TrendingDown, RefreshCw } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Button } from "@/components/ui/button"

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

const statCards = [
  { title: "DNSHE Accounts", key: "accounts", icon: Server, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30" },
  { title: "Domains", key: "domains", icon: Globe, color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/30" },
  { title: "DNS Records", key: "records", icon: FileText, color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/30" },
  { title: "API Status", key: "apiStatus", icon: Activity, color: "text-orange-600", bg: "bg-orange-100 dark:bg-orange-900/30" },
]

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [usage, setUsage] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = () => {
    setLoading(true)
    Promise.all([
      api.get("/users/dashboard").catch(() => ({ data: {} })),
      api.get("/users/api-usage").catch(() => ({ data: { data: [] } })),
      api.get("/notifications").catch(() => ({ data: { data: [] } })),
    ]).then(([s, u, n]) => {
      setStats(s.data.data || s.data)
      setUsage(u.data.data || u.data || [])
      setNotifications(n.data.data || n.data || [])
    }).finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const getTrendIcon = (key: string) => {
    if (!stats?.trends) return null
    const trend = stats.trends[key]
    if (trend === undefined) return null
    return trend > 0
      ? <TrendingUp className="h-4 w-4 text-green-500" />
      : <TrendingDown className="h-4 w-4 text-red-500" />
  }

  const getTrendValue = (key: string) => {
    if (!stats?.trends) return null
    const trend = stats.trends[key]
    if (trend === undefined) return null
    return <span className={cn("text-xs", trend > 0 ? "text-green-500" : "text-red-500")}>{trend > 0 ? "+" : ""}{trend}%</span>
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to your DNSHE management platform</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4 mr-1", loading && "animate-spin")} />
          Refresh
        </Button>
      </motion.div>

      <motion.div variants={item} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.key} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <div className={cn("p-2 rounded-full", card.bg)}>
                <card.icon className={cn("h-4 w-4", card.color)} />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div>
                  <div className="text-2xl font-bold">
                    {stats?.[card.key] ?? (card.key === "apiStatus" ? "Active" : "0")}
                  </div>
                  {card.key !== "apiStatus" && getTrendIcon(card.key) && (
                    <div className="flex items-center gap-1 mt-1">
                      {getTrendIcon(card.key)}
                      {getTrendValue(card.key)}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2">
        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle>API Usage</CardTitle>
              <CardDescription>API requests over the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[300px]" />
              ) : usage.length === 0 ? (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">No usage data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={usage}>
                    <defs>
                      <linearGradient id="usageGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 12 }} />
                    <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))" }} />
                    <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="url(#usageGradient)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest system notifications</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">No recent activity</div>
              ) : (
                <div className="space-y-3">
                  {notifications.slice(0, 5).map((n: any) => (
                    <div key={n.id} className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <Badge variant={n.type === "error" ? "destructive" : n.type === "warning" ? "warning" : "secondary"} className="capitalize">
                        {n.type || "info"}
                      </Badge>
                      <span className="flex-1 truncate">{n.message}</span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(n.createdAt || n.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ")
}
