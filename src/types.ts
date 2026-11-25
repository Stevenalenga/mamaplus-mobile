export type UserRole =
  | 'PENDING'
  | 'USER'
  | 'AGENCY'
  | 'INSTRUCTOR'
  | 'ADMIN_ASSISTANT'
  | 'ADMIN'

export interface User {
  id: string
  email: string
  name: string | null
  role: UserRole
  phoneNumber: string | null
  avatar: string | null
  isVerified: boolean
  gender?: string | null
}

/** Server-backed login session (from standalone API session management). */
export interface AuthSession {
  id: string
  userAgent: string | null
  ip: string | null
  createdAt: string
  lastSeenAt: string
  expiresAt: string
  revokedAt: string | null
  current: boolean
}

export interface AuthPayload {
  token: string
  user: User
  session?: AuthSession
}

export interface SignUpParams {
  email: string
  password: string
  name: string
  phoneNumber?: string
}

export interface AuthContextState {
  user: User | null
  token: string | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (payload: SignUpParams) => Promise<void>
  signOut: () => Promise<void>
  /** Persist updated user (and optional refreshed token/session after onboarding). */
  updateUser: (user: User, nextToken?: string, session?: AuthSession) => void
}

// ─── Root stack (auth + onboarding gate) ────────────────────────────────────

export type RootStackParamList = {
  Login: undefined
  Register: undefined
  Onboarding: undefined
  UserMain: undefined
  AgencyMain: undefined
  EducatorMain: undefined
  AdminAssistantMain: undefined
  AdminMain: undefined
}

// ─── USER (Caregiver) ───────────────────────────────────────────────────────

export type UserTabParamList = {
  Home: undefined
  Courses: undefined
  Blog: undefined
  Profile: undefined
}

export type UserStackParamList = {
  Tabs: undefined
  CourseDetail: { courseId: string; courseTitle: string }
  BlogDetail: { slug: string; title?: string }
}

export type ProfileStackParamList = {
  ProfileMain: undefined
  EditProfile: undefined
  ChangePassword: undefined
  AgencyCaregivers: undefined
  Contact: undefined
  Blog: undefined
  BlogDetail: { slug: string; title?: string }
  Sessions: undefined
}

export interface BlogPost {
  id?: string
  slug: string
  title: string
  description: string
  content: string
  author: string
  publishedAt: string
  updatedAt?: string
  category: string
  tags: string[]
  image?: string
  readTime: string
  isPublished?: boolean
}

// ─── AGENCY ─────────────────────────────────────────────────────────────────

export type AgencyTabParamList = {
  Home: undefined
  Search: undefined
  Profile: undefined
}

// ─── EDUCATOR (INSTRUCTOR) ──────────────────────────────────────────────────

export type EducatorTabParamList = {
  Home: undefined
  Courses: undefined
  Profile: undefined
}

// ─── ADMIN ASSISTANT ────────────────────────────────────────────────────────

export type AdminAssistantTabParamList = {
  Home: undefined
  Blog: undefined
  Profile: undefined
}

// ─── ADMIN ──────────────────────────────────────────────────────────────────

export type AdminTabParamList = {
  Home: undefined
  Courses: undefined
  Manage: undefined
  Profile: undefined
}

export type AdminManageStackParamList = {
  ManageHome: undefined
  Users: undefined
  Enrollments: undefined
  Payments: undefined
  Agencies: undefined
  Reviews: undefined
  Certificates: undefined
  Schools: undefined
  Blog: undefined
}

// ─── Shared ─────────────────────────────────────────────────────────────────

/** Legacy alias kept so existing imports don't break */
export type TabParamList = UserTabParamList
