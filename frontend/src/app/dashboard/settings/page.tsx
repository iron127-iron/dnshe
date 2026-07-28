"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { api } from "@/lib/api"
import { cn, formatDateTime } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  User, Lock, Shield, Monitor, Activity, Loader2, CheckCircle2, XCircle, Smartphone, LogOut, Key,
} from "lucide-react"
import { toast } from "sonner"

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [sessions, setSessions] = useState<any[]>([])
  const [usage, setUsage] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)
  const [qrCode, setQrCode] = useState("")
  const [verify2fa, setVerify2fa] = useState("")
  const [show2faSetup, setShow2faSetup] = useState(false)

  const [profileForm, setProfileForm] = useState({ displayName: "", avatarUrl: "" })
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" })

  const fetchSettings = () => {
    setLoading(true)
    Promise.all([
      api.get("/auth/me").catch(() => ({ data: {} })),
      api.get("/auth/sessions").catch(() => ({ data: { data: [] } })),
      api.get("/users/api-usage").catch(() => ({ data: {} })),
    ]).then(([p, s, u]) => {
      const data = p.data.data || p.data
      setProfile(data)
      setProfileForm({ displayName: data.displayName || data.username || "", avatarUrl: data.avatar || "" })
      setSessions(s.data.data || s.data || [])
      setUsage(u.data.data || u.data || {})
    }).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { fetchSettings() }, [])

  const handleSaveProfile = async () => {
    setSubmitting(true)
    try {
      await api.put("/auth/me", profileForm)
      toast.success("Profile updated")
      fetchSettings()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update profile")
    } finally { setSubmitting(false) }
  }

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    setSubmitting(true)
    try {
      await api.put("/auth/password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      toast.success("Password changed")
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to change password")
    } finally { setSubmitting(false) }
  }

  const handleEnable2FA = async () => {
    try {
      const res = await api.post("/auth/2fa/enable")
      setQrCode(res.data?.qrCode || res.data?.url || "")
      setShow2faSetup(true)
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to enable 2FA")
    }
  }

  const handleVerify2FA = async () => {
    try {
      await api.post("/auth/2fa/verify", { token: verify2fa })
      toast.success("2FA enabled")
      setShow2faSetup(false)
      setVerify2fa("")
      fetchSettings()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Verification failed")
    }
  }

  const handleDisable2FA = async () => {
    try {
      await api.post("/auth/2fa/disable")
      toast.success("2FA disabled")
      fetchSettings()
    } catch { toast.error("Failed to disable 2FA") }
  }

  const handleRevokeSession = async (id: string) => {
    try {
      await api.delete(`/auth/sessions/${id}`)
      toast.success("Session revoked")
      fetchSettings()
    } catch { toast.error("Failed to revoke session") }
  }

  const initials = profile?.username ? profile.username.slice(0, 2).toUpperCase() : "U"

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile"><User className="h-4 w-4 mr-1" /> Profile</TabsTrigger>
          <TabsTrigger value="password"><Lock className="h-4 w-4 mr-1" /> Password</TabsTrigger>
          <TabsTrigger value="2fa"><Shield className="h-4 w-4 mr-1" /> 2FA</TabsTrigger>
          <TabsTrigger value="sessions"><Monitor className="h-4 w-4 mr-1" /> Sessions</TabsTrigger>
          <TabsTrigger value="api"><Activity className="h-4 w-4 mr-1" /> API</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Update your display name and avatar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={profile?.avatar} />
                      <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{profile?.username}</p>
                      <p className="text-sm text-muted-foreground">{profile?.email}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input id="displayName" value={profileForm.displayName} onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="avatarUrl">Avatar URL</Label>
                    <Input id="avatarUrl" placeholder="https://..." value={profileForm.avatarUrl} onChange={(e) => setProfileForm({ ...profileForm, avatarUrl: e.target.value })} />
                  </div>
                  <Button onClick={handleSaveProfile} disabled={submitting}>
                    {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                    Save Changes
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input id="confirmPassword" type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} />
              </div>
              <Button onClick={handleChangePassword} disabled={submitting || !passwordForm.currentPassword || !passwordForm.newPassword}>
                {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Update Password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="2fa">
          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>Add an extra layer of security to your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <Skeleton className="h-10 w-full" />
              ) : profile?.twoFactorEnabled ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">2FA is enabled</span>
                  </div>
                  <Button variant="destructive" onClick={handleDisable2FA}>Disable 2FA</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Secure your account with two-factor authentication.</p>
                  {!show2faSetup ? (
                    <Button onClick={handleEnable2FA}>
                      <Shield className="h-4 w-4 mr-1" /> Enable 2FA
                    </Button>
                  ) : (
                    <div className="space-y-4 border rounded-lg p-4">
                      <p className="text-sm font-medium">Scan this QR code with your authenticator app:</p>
                      {qrCode && (
                        <div className="flex justify-center">
                          <img src={qrCode} alt="2FA QR Code" className="h-48 w-48 border rounded-lg" />
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="verifyCode">Verification Code</Label>
                        <Input id="verifyCode" placeholder="Enter 6-digit code" value={verify2fa} onChange={(e) => setVerify2fa(e.target.value)} maxLength={6} className="w-40" />
                      </div>
                      <Button onClick={handleVerify2FA} disabled={verify2fa.length !== 6}>
                        <Key className="h-4 w-4 mr-1" /> Verify & Enable
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>Manage your active login sessions</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active sessions</p>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session: any) => (
                    <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Monitor className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{session.device || session.userAgent || "Unknown device"}</p>
                          <p className="text-xs text-muted-foreground">
                            IP: {session.ip} &middot; Last used: {session.lastUsed ? formatDateTime(session.lastUsed) : "Now"}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleRevokeSession(session.id)}>
                        <LogOut className="h-4 w-4 mr-1" /> Revoke
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>API Usage</CardTitle>
              <CardDescription>Your API usage summary</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="grid grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20" />)}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="border rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold">{usage?.totalRequests || 0}</p>
                    <p className="text-sm text-muted-foreground">Total Requests</p>
                  </div>
                  <div className="border rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold">{usage?.today || 0}</p>
                    <p className="text-sm text-muted-foreground">Today</p>
                  </div>
                  <div className="border rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold">{usage?.limit || "Unlimited"}</p>
                    <p className="text-sm text-muted-foreground">Monthly Limit</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
