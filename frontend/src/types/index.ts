export interface User {
  id: string
  email: string
  emailVerified: boolean
  username: string
  displayName?: string
  avatar?: string
  role: 'SUPER_ADMIN' | 'ADMIN' | 'PREMIUM_USER' | 'FREE_USER'
  isActive: boolean
  isBlocked: boolean
  twoFactorEnabled: boolean
  lastLoginAt?: string
  lastLoginIp?: string
  createdAt: string
  updatedAt: string
}

export interface Session {
  id: string
  userId: string
  ipAddress?: string
  userAgent?: string
  device?: string
  location?: string
  isActive: boolean
  lastUsed: string
  expiresAt: string
  createdAt: string
}

export interface DnsheAccount {
  id: string
  userId: string
  name: string
  apiKey: string
  apiSecret: string
  notes?: string
  tags?: string[]
  isActive: boolean
  lastSyncAt?: string
  createdAt: string
  updatedAt: string
}

export interface Domain {
  id: string
  dnsheAccountId: string
  userId: string
  domain: string
  status?: string
  registeredAt?: string
  expiresAt?: string
  autoRenew: boolean
  createdAt: string
  updatedAt: string
}

export interface DnsRecord {
  id: string
  domainId: string
  recordId?: string
  type: string
  name: string
  value: string
  ttl: number
  priority?: number
  status?: string
  createdAt: string
  updatedAt: string
}

export interface AuditLog {
  id: string
  userId: string
  action: string
  resource: string
  resourceId?: string
  details?: string
  ipAddress?: string
  userAgent?: string
  createdAt: string
}

export interface Notification {
  id: string
  userId: string
  type: string
  title: string
  message: string
  isRead: boolean
  link?: string
  createdAt: string
}

export interface ApiUsage {
  id: string
  userId: string
  endpoint: string
  method: string
  statusCode?: number
  ipAddress?: string
  createdAt: string
}

export interface LoginResponse {
  user: User
  accessToken: string
  refreshToken: string
}

export interface DashboardStats {
  accounts: number
  domains: number
  records: number
  apiStatus: string
}
