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
