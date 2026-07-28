"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2, Server } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

export default function NewAccountPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ name: "", apiKey: "", apiSecret: "", notes: "", tags: "" })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = { ...form, tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [] }
      await api.post("/dnshe/accounts", payload)
      toast.success("Account created successfully")
      router.push("/dashboard/accounts")
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create account")
    } finally { setSubmitting(false) }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/accounts"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Account</h1>
          <p className="text-muted-foreground">Add a new DNSHE provider account</p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-primary" />
              <CardTitle>Account Details</CardTitle>
            </div>
            <CardDescription>Enter your DNSHE API credentials to connect a provider account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Account Name *</Label>
              <Input id="name" placeholder="My DNSHE Account" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key *</Label>
              <Input id="apiKey" placeholder="dnshe_..." value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiSecret">API Secret *</Label>
              <Input id="apiSecret" type="password" placeholder="Secret key" value={form.apiSecret} onChange={(e) => setForm({ ...form, apiSecret: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input id="tags" placeholder="production, primary" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" placeholder="Optional notes..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" asChild>
              <Link href="/dashboard/accounts">Cancel</Link>
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Create Account
            </Button>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  )
}
