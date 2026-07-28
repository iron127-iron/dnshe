export interface User {
  id: string
  email: string
  username: string
  displayName?: string
  avatarUrl?: string
  emailVerified: boolean
  twoFactorEnabled: boolean
  roles: string[]
  createdAt: string
  updatedAt: string
}

export interface Session {
  id: string
  userId: string
  ipAddress: string
  userAgent: string
  lastActivity: string
  createdAt: string
  expiresAt: string
}

export interface DnsheAccount {
  id: string
  userId: string
  name: string
  provider: string
  apiKey: string
  apiSecretMasked: string
  notes?: string
  tags?: string[]
  isActive: boolean
  lastSyncedAt?: string
  createdAt: string
  updatedAt: string
}

export interface Domain {
  id: string
  accountId: string
  name: string
  zoneId?: string
  status: 'active' | 'pending' | 'suspended' | 'expired'
  nameservers?: string[]
  registrar?: string
  expiresAt?: string
  autoRenew: boolean
  dnssecEnabled: boolean
  recordCount: number
  traffic?: {
    queries: number
    period: string
  }
  createdAt: string
  updatedAt: string
}

export interface DnsRecord {
  id: string
  domainId: string
  type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS' | 'SRV' | 'CAA'
  name: string
  value: string
  ttl: number
  priority?: number
  proxied?: boolean
  status: 'active' | 'pending' | 'disabled'
  createdAt: string
  updatedAt: string
}

export interface AuditLog {
  id: string
  userId: string
  action: string
  resource: string
  resourceId?: string
  details?: Record<string, unknown>
  ipAddress: string
  userAgent?: string
  createdAt: string
}

export interface Notification {
  id: string
  userId: string
  type: 'info' | 'warning' | 'error' | 'success'
  title: string
  message: string
  read: boolean
  link?: string
  createdAt: string
}

export interface ApiUsage {
  date: string
  requests: number
  errors: number
  avgLatency: number
}

export interface LoginResponse {
  user: User
  accessToken: string
  requiresTwoFactor?: boolean
}

export interface RegisterResponse {
  user: User
  accessToken: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface DashboardStats {
  totalDomains: number
  totalRecords: number
  totalAccounts: number
  activeDomains: number
  recentQueries: number
  queriesChange: number
  errorsToday: number
  errorsChange: number
  avgLatency: number
  latencyChange: number
  domainsByStatus: { status: string; count: number }[]
  usageLast7Days: ApiUsage[]
  recentActivity: AuditLog[]
}
