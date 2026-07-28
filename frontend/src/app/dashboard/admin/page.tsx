"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { api } from "@/lib/api"
import { cn, formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import {
  Users, Server, Globe, Activity, Search, Loader2, Shield, ShieldOff, RotateCcw, Trash2, Send, BarChart3, FileText, UserX, CheckCircle2, XCircle,
} from "lucide-react"
import { toast } from "sonner"

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

const roleColors: Record<string, "default" | "secondary" | "destructive" | "warning"> = {
  SUPER_ADMIN: "destructive",
  ADMIN: "warning",
  USER: "secondary",
}

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [apiUsage, setApiUsage] = useState<any[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userSearch, setUserSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [auditFilter, setAuditFilter] = useState({ action: "", userId: "" })
  const [auditPage, setAuditPage] = useState(1)
  const [broadcastOpen, setBroadcastOpen] = useState(false)
  const [broadcastForm, setBroadcastForm] = useState({ title: "", message: "", userId: "" })
  const [submitting, setSubmitting] = useState(false)

  const fetchData = useCallback(() => {
    setLoading(true)
    Promise.all([
      api.get("/admin/users").catch(() => ({ data: { data: [] } })),
      api.get("/admin/stats").catch(() => ({ data: {} })),
      api.get("/admin/api-usage").catch(() => ({ data: { data: [] } })),
      api.get("/admin/audit-logs", { params: { page: auditPage } }).catch(() => ({ data: { data: [] } })),
    ]).then(([u, s, a, l]) => {
      setUsers(u.data.data || u.data || [])
      setStats(s.data.data || s.data)
      setApiUsage(a.data.data || a.data || [])
      setAuditLogs(l.data.data || l.data || [])
    }).catch(() => toast.error("Failed to load admin data"))
      .finally(() => setLoading(false))
  }, [auditPage])

  useEffect(() => { fetchData() }, [fetchData])

  const handleRoleChange = async (userId: string, role: string) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role })
      toast.success("Role updated")
      fetchData()
    } catch { toast.error("Failed to update role") }
  }

  const handleToggleBlock = async (userId: string, blocked: boolean) => {
    try {
      if (blocked) {
        await api.post(`/admin/users/${userId}/unblock`)
        toast.success("User unblocked")
      } else {
        await api.post(`/admin/users/${userId}/block`)
        toast.success("User blocked")
      }
      fetchData()
    } catch { toast.error("Failed to toggle user status") }
  }

  const handleResetPassword = async (userId: string) => {
    try {
      await api.post(`/admin/users/${userId}/reset-password`)
      toast.success("Password reset email sent")
    } catch { toast.error("Failed to reset password") }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      await api.delete(`/admin/users/${userId}`)
      toast.success("User deleted")
      fetchData()
    } catch { toast.error("Failed to delete user") }
  }

  const handleBroadcast = async () => {
    setSubmitting(true)
    try {
      await api.post("/admin/notifications", broadcastForm)
      toast.success("Notification sent")
      setBroadcastOpen(false)
      setBroadcastForm({ title: "", message: "", userId: "" })
    } catch { toast.error("Failed to send notification") }
    finally { setSubmitting(false) }
  }

  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.username?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase())
    const matchesRole = roleFilter === "all" || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  const statCards = [
    { title: "Total Users", key: "totalUsers", icon: Users, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30" },
    { title: "Total Accounts", key: "totalAccounts", icon: Server, color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/30" },
    { title: "Total Domains", key: "totalDomains", icon: Globe, color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/30" },
    { title: "Total API Calls", key: "totalApiCalls", icon: Activity, color: "text-orange-600", bg: "bg-orange-100 dark:bg-orange-900/30" },
  ]

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
          <p className="text-muted-foreground">System administration and user management</p>
        </div>
      </motion.div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="users"><Users className="h-4 w-4 mr-1" /> Users</TabsTrigger>
          <TabsTrigger value="stats"><BarChart3 className="h-4 w-4 mr-1" /> Stats</TabsTrigger>
          <TabsTrigger value="api-usage"><Activity className="h-4 w-4 mr-1" /> API Usage</TabsTrigger>
          <TabsTrigger value="audit"><FileText className="h-4 w-4 mr-1" /> Audit Logs</TabsTrigger>
          <TabsTrigger value="notifications"><Send className="h-4 w-4 mr-1" /> Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <motion.div variants={item}>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      className="pl-9"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                    />
                  </div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="All Roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="USER">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user: any) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.username}</TableCell>
                          <TableCell className="text-muted-foreground">{user.email}</TableCell>
                          <TableCell>
                            <Select
                              value={user.role}
                              onValueChange={(val) => handleRoleChange(user.id, val)}
                            >
                              <SelectTrigger className={cn("h-7 w-[130px]", roleColors[user.role] === "destructive" && "border-destructive text-destructive")}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="USER">User</SelectItem>
                                <SelectItem value="ADMIN">Admin</SelectItem>
                                <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            {user.blocked ? (
                              <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Blocked</Badge>
                            ) : (
                              <Badge variant="success"><CheckCircle2 className="h-3 w-3 mr-1" /> Active</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {user.createdAt ? formatDate(user.createdAt) : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleToggleBlock(user.id, user.blocked)}
                                title={user.blocked ? "Unblock" : "Block"}
                              >
                                {user.blocked ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <ShieldOff className="h-4 w-4 text-destructive" />}
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleResetPassword(user.id)} title="Reset Password">
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteUser(user.id)} title="Delete User">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="stats">
          <motion.div variants={item} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statCards.map((card) => (
              <Card key={card.key}>
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
                    <div className="text-2xl font-bold">{stats?.[card.key] ?? 0}</div>
                  )}
                </CardContent>
              </Card>
            ))}
          </motion.div>
        </TabsContent>

        <TabsContent value="api-usage">
          <motion.div variants={item}>
            <Card>
              <CardHeader>
                <CardTitle>API Usage Across All Users</CardTitle>
                <CardDescription>Aggregated API requests over time</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-[300px]" />
                ) : apiUsage.length === 0 ? (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">No data available</div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={apiUsage}>
                      <defs>
                        <linearGradient id="adminUsageGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 12 }} />
                      <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))" }} />
                      <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="url(#adminUsageGradient)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="audit">
          <motion.div variants={item}>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Filter by action..."
                      className="pl-9"
                      value={auditFilter.action}
                      onChange={(e) => setAuditFilter({ ...auditFilter, action: e.target.value })}
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setAuditPage((p) => Math.max(1, p - 1))} disabled={auditPage === 1}>
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">Page {auditPage}</span>
                  <Button variant="outline" size="sm" onClick={() => setAuditPage((p) => p + 1)}>
                    Next
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : auditLogs.length === 0 ? (
                  <div className="flex items-center justify-center py-12 text-muted-foreground">No audit logs found</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Action</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>IP</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.map((log: any) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-xs">{log.action}</Badge>
                          </TableCell>
                          <TableCell>{log.username || log.userId || "-"}</TableCell>
                          <TableCell className="max-w-[300px] truncate text-sm text-muted-foreground">{log.details || "-"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground font-mono">{log.ip || "-"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{log.createdAt ? formatDate(log.createdAt) : "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="notifications">
          <motion.div variants={item}>
            <Card>
              <CardHeader>
                <CardTitle>Broadcast Notification</CardTitle>
                <CardDescription>Send a notification to all users or a specific user</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notif-title">Title</Label>
                  <Input id="notif-title" placeholder="Notification title" value={broadcastForm.title} onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notif-message">Message</Label>
                  <Textarea id="notif-message" placeholder="Notification message..." value={broadcastForm.message} onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notif-user">Send to specific user (optional)</Label>
                  <Select value={broadcastForm.userId} onValueChange={(val) => setBroadcastForm({ ...broadcastForm, userId: val })}>
                    <SelectTrigger id="notif-user">
                      <SelectValue placeholder="All users" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All users</SelectItem>
                      {users.map((u: any) => (
                        <SelectItem key={u.id} value={u.id}>{u.username} ({u.email})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleBroadcast} disabled={submitting || !broadcastForm.title || !broadcastForm.message}>
                  {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  <Send className="h-4 w-4 mr-1" /> Send Notification
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
