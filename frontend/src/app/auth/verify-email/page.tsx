"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Check, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { api } from "@/lib/api"

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setMessage("No verification token found")
      return
    }
    api.post("/auth/verify-email", { token })
      .then(() => { setStatus("success"); setMessage("Email verified successfully!") })
      .catch((err) => { setStatus("error"); setMessage(err.response?.data?.message || "Verification failed") })
  }, [token])

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="w-[400px] text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            {status === "loading" && <Loader2 className="h-12 w-12 animate-spin text-primary" />}
            {status === "success" && <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto"><Check className="h-6 w-6 text-green-600" /></div>}
            {status === "error" && <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto"><X className="h-6 w-6 text-red-600" /></div>}
          </div>
          <CardTitle className="text-2xl">
            {status === "loading" ? "Verifying..." : status === "success" ? "Verified!" : "Verification failed"}
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent>
          {status === "success" && <Button onClick={() => router.push("/auth/login")}>Go to Login</Button>}
          {status === "error" && <Button variant="outline" onClick={() => router.push("/auth/login")}>Back to Login</Button>}
        </CardContent>
      </Card>
    </motion.div>
  )
}
