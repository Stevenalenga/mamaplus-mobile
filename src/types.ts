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

export interface AuthPayload {
  token: string
  user: User
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
  signInWithSocial: (auth: AuthPayload) => Promise<void>
  signOut: () => Promise<void>
  updateUser: (user: User) => void
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
  Profile: undefined
}

export type UserStackParamList = {
  Tabs: undefined
  CourseDetail: { courseId: string; courseTitle: string }
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
  Profile: undefined
}

// ─── ADMIN ASSISTANT ────────────────────────────────────────────────────────

export type AdminAssistantTabParamList = {
  Home: undefined
  Courses: undefined
  Profile: undefined
}

// ─── ADMIN ──────────────────────────────────────────────────────────────────

export type AdminTabParamList = {
  Home: undefined
  Courses: undefined
  Schools: undefined
  Profile: undefined
}

// ─── Shared ─────────────────────────────────────────────────────────────────

/** Legacy alias kept so existing imports don't break */
export type TabParamList = UserTabParamList
