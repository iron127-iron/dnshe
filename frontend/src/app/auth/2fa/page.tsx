"use client"

import { useState, useRef, KeyboardEvent } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/lib/api"

export default function TwoFactorPage() {
  const router = useRouter()
  const [code, setCode] = useState(["", "", "", "", "", ""])
  const [isLoading, setIsLoading] = useState(false)
  const refs = useRef<(HTMLInputElement | null)[]>([])

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return
    const newCode = [...code]
    newCode[index] = value.slice(-1)
    setCode(newCode)
    if (value && index < 5) refs.current[index + 1]?.focus()
  }

  function handleKeyDown(index: number, e: KeyboardEvent) {
    if (e.key === "Backspace" && !code[index] && index > 0) refs.current[index - 1]?.focus()
  }

  async function handleVerify() {
    const token = code.join("")
    if (token.length !== 6) { toast.error("Please enter the full 6-digit code"); return }
    setIsLoading(true)
    try {
      await api.post("/auth/2fa/verify", { token })
      toast.success("2FA verified")
      router.push("/dashboard")
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Invalid code")
      setCode(["", "", "", "", "", ""])
      refs.current[0]?.focus()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="w-[400px]">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Two-factor authentication</CardTitle>
          <CardDescription>Enter the 6-digit code from your authenticator app</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center gap-2">
            {code.map((digit, i) => (
              <Input
                key={i}
                ref={(el) => { refs.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-12 h-12 text-center text-lg"
              />
            ))}
          </div>
          <Button className="w-full" onClick={handleVerify} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Verify
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            <button className="hover:underline">Use a recovery code</button>
          </p>
        </CardContent>
      </Card>
    </motion.div>
  )
}
