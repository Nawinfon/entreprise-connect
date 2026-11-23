// Auto-generated from your database schema — do not edit by hand.
// Regenerates automatically whenever a table is created or altered.

export type AnnouncementsRow = {
  id: string
  userId: string
  companyId: string
  title: string
  body: string
  audience: string
  published: boolean
  createdAt: string
}

export type CompaniesRow = {
  id: string
  userId: string
  name: string
  description: string | null
  phone: string | null
  email: string | null
  logoUrl: string | null
  createdAt: string
}

export type CompanyInvitationsRow = {
  id: string
  companyId: string
  email: string | null
  invitationCode: string
  role: string
  status: string
  expiresAt: string
  createdAt: string
  invitedBy: string
}

export type CompanyMembersRow = {
  id: string
  companyId: string
  userId: string
  role: string
  status: string
  createdAt: string
}

export type ComplaintsRow = {
  id: string
  userId: string
  companyId: string
  title: string
  description: string
  status: string
  response: string | null
  createdAt: string
}

export type TasksRow = {
  id: string
  userId: string
  companyId: string
  title: string
  description: string | null
  assigneeName: string | null
  status: string
  dueDate: string | null
  createdAt: string
}

export type UserProfilesRow = {
  id: string
  userId: string
  companyId: string | null
  role: string
  displayName: string | null
  phone: string | null
  createdAt: string
}

export type UsersRow = {
  id: string
  email: string
  emailVerified: number | string | null
  displayName: string | null
  avatarUrl: string | null
  phone: string | null
  phoneVerified: number | string | null
  role: string | null
  metadata: string | null
  createdAt: string
  updatedAt: string
  lastSignIn: string
}
