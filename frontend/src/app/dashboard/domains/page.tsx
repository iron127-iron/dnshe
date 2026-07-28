"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { api } from "@/lib/api"
import { cn, formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Search, Globe, MoreHorizontal, Eye, RefreshCw, Trash2, Download, FileText, Shield, Clock, ExternalLink, Loader2, CheckCircle2, XCircle, AlertTriangle,
} from "lucide-react"
import { toast } from "sonner"

interface Domain {
  id: string
  domain: string
  accountId?: string
  accountName?: string
  status: "active" | "inactive" | "expiring" | "expired"
  recordsCount?: number
  expires?: string
  createdAt?: string
}

interface Account {
  id: string
  name: string
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

const statusVariant: Record<string, "success" | "secondary" | "warning" | "destructive"> = {
  active: "success",
  inactive: "secondary",
  expiring: "warning",
  expired: "destructive",
}

export default function DomainsPage() {
  const [domains, setDomains] = useState<Domain[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [accountFilter, setAccountFilter] = useState("all")
  const [selectedTab, setSelectedTab] = useState("all")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [deleteDomain, setDeleteDomain] = useState<Domain | null>(null)

  const fetchData = () => {
    setLoading(true)
    Promise.all([
      api.get("/domains").catch(() => ({ data: { data: [] } })),
      api.get("/dnshe/accounts").catch(() => ({ data: { data: [] } })),
    ]).then(([d, a]) => {
      setDomains(d.data.data || d.data || [])
      setAccounts(a.data.data || a.data || [])
    }).catch(() => toast.error("Failed to load domains"))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const filtered = domains.filter((d) => {
    const matchesSearch = d.domain.toLowerCase().includes(search.toLowerCase())
    const matchesAccount = accountFilter === "all" || d.accountId === accountFilter
    return matchesSearch && matchesAccount
  })

  const allSelected = filtered.length > 0 && selectedIds.length === filtered.length
  const toggleAll = () => setSelectedIds(allSelected ? [] : filtered.map((d) => d.id))
  const toggleOne = (id: string) => setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedIds.map((id) => api.delete(`/domains/${id}`)))
      toast.success(`${selectedIds.length} domains deleted`)
      setSelectedIds([])
      fetchData()
    } catch { toast.error("Bulk delete failed") }
  }

  const handleBulkSync = async () => {
    toast.info(`Syncing ${selectedIds.length} domains...`)
    try {
      await Promise.all(selectedIds.map((id) => api.post(`/domains/${id}/sync`)))
      toast.success(`${selectedIds.length} domains synced`)
      fetchData()
    } catch { toast.error("Bulk sync failed") }
  }

  const handleExport = async (format: "json" | "csv") => {
    try {
      const res = await api.get(`/domains/export?format=${format}`, { responseType: "blob" })
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement("a")
      a.href = url
      a.download = `domains.${format}`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`Exported as ${format.toUpperCase()}`)
    } catch { toast.error("Export failed") }
  }

  const handleDelete = async () => {
    if (!deleteDomain) return
    try {
      await api.delete(`/domains/${deleteDomain.id}`)
      toast.success("Domain deleted")
      setDeleteDomain(null)
      fetchData()
    } catch { toast.error("Failed to delete domain") }
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Domains</h1>
          <p className="text-muted-foreground">Manage your DNS domains across all accounts</p>
        </div>
      </motion.div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <motion.div variants={item}>
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="all">All Domains</TabsTrigger>
              <TabsTrigger value="records">DNS Records</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              {selectedIds.length > 0 && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleBulkSync}>
                    <RefreshCw className="h-4 w-4 mr-1" /> Sync ({selectedIds.length})
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive" onClick={handleBulkDelete}>
                    <Trash2 className="h-4 w-4 mr-1" /> Delete ({selectedIds.length})
                  </Button>
                </div>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" /> Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExport("json")}>
                    <FileText className="h-4 w-4 mr-2" /> Export JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport("csv")}>
                    <FileText className="h-4 w-4 mr-2" /> Export CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </motion.div>

        <TabsContent value="all">
          <motion.div variants={item}>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search domains..."
                      className="pl-9"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <Select value={accountFilter} onValueChange={setAccountFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="All Accounts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Accounts</SelectItem>
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
                    <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Globe className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium">No domains found</h3>
                    <p className="text-sm text-muted-foreground">Domains will appear here once added through your DNSHE accounts</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                        </TableHead>
                        <TableHead>Domain</TableHead>
                        <TableHead>Account</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Records</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((domain) => (
                        <TableRow key={domain.id} className={cn(selectedIds.includes(domain.id) && "bg-muted/50")}>
                          <TableCell>
                            <Checkbox checked={selectedIds.includes(domain.id)} onCheckedChange={() => toggleOne(domain.id)} />
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4 text-muted-foreground" />
                              {domain.domain}
                            </div>
                          </TableCell>
                          <TableCell>{domain.accountName || "-"}</TableCell>
                          <TableCell>
                            <Badge variant={statusVariant[domain.status] || "secondary"}>
                              {domain.status === "active" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                              {domain.status === "expiring" && <AlertTriangle className="h-3 w-3 mr-1" />}
                              {domain.status === "expired" && <XCircle className="h-3 w-3 mr-1" />}
                              {domain.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{domain.recordsCount ?? "-"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {domain.expires ? formatDate(domain.expires) : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => toast.info("WHOIS lookup for " + domain.domain)}>
                                  <ExternalLink className="h-4 w-4 mr-2" /> WHOIS
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toast.info("Renew domain: " + domain.domain)}>
                                  <Clock className="h-4 w-4 mr-2" /> Renew
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onClick={() => setDeleteDomain(domain)}>
                                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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

        <TabsContent value="records">
          <motion.div variants={item}>
            <RecordsView accounts={accounts} />
          </motion.div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!deleteDomain} onOpenChange={(o) => { if (!o) setDeleteDomain(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete domain?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteDomain?.domain}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}

function RecordsView({ accounts }: { accounts: Account[] }) {
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterAccount, setFilterAccount] = useState("all")

  useEffect(() => {
    setLoading(true)
    const url = filterAccount === "all" ? "/records" : `/records?accountId=${filterAccount}`
    api.get(url).then((res) => {
      setRecords(res.data.data || res.data || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [filterAccount])

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-4">
          <Select value={filterAccount} onValueChange={setFilterAccount}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Accounts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Accounts</SelectItem>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">No DNS records found</h3>
            <p className="text-sm text-muted-foreground">Records will appear here once domains are synced</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>TTL</TableHead>
                <TableHead>Domain</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium font-mono text-sm">{r.name}</TableCell>
                  <TableCell><Badge variant="outline">{r.type}</Badge></TableCell>
                  <TableCell className="font-mono text-sm max-w-[300px] truncate">{r.value}</TableCell>
                  <TableCell className="text-sm">{r.ttl || "Auto"}</TableCell>
                  <TableCell className="text-sm">{r.domain || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
