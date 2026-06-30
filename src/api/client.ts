import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { API_BASE_URL, AUTH_STORAGE_KEY } from '../constants'
import { AuthPayload, SignUpParams } from '../types'

const isWeb = Platform.OS === 'web'

function parseAuthPayload(raw: string | null): AuthPayload | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthPayload
  } catch (error) {
    console.warn('Failed to parse stored auth payload', error)
    return null
  }
}

function readFromLocalStorage(): AuthPayload | null {
  if (typeof window === 'undefined' || !window.localStorage) return null
  return parseAuthPayload(window.localStorage.getItem(AUTH_STORAGE_KEY))
}

function writeToLocalStorage(serialized: string) {
  if (typeof window === 'undefined' || !window.localStorage) return
  window.localStorage.setItem(AUTH_STORAGE_KEY, serialized)
}

function clearLocalStorage() {
  if (typeof window === 'undefined' || !window.localStorage) return
  window.localStorage.removeItem(AUTH_STORAGE_KEY)
}

export async function saveAuthData(payload: AuthPayload) {
  const serialized = JSON.stringify(payload)

  if (isWeb) {
    writeToLocalStorage(serialized)
    return
  }

  try {
    await Promise.race([
      SecureStore.setItemAsync(AUTH_STORAGE_KEY, serialized),
      new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error('SecureStore write timed out')), 5000)
      )
    ])
  } catch (error) {
    console.warn('saveAuthData: SecureStore set failed', error)
  }
}

export async function loadAuthData(): Promise<AuthPayload | null> {
  if (isWeb) {
    return readFromLocalStorage()
  }

  try {
    const raw = await SecureStore.getItemAsync(AUTH_STORAGE_KEY)
    return parseAuthPayload(raw)
  } catch (error) {
    console.warn('loadAuthData: SecureStore read failed', error)
    return null
  }
}

export async function clearAuthData() {
  if (isWeb) {
    clearLocalStorage()
    return
  }

  try {
    await SecureStore.deleteItemAsync(AUTH_STORAGE_KEY)
  } catch (error) {
    console.warn('clearAuthData: SecureStore delete failed', error)
  }
}

async function request<T>(path: string, options: RequestInit = {}, token?: string | null) {
  const url = `${API_BASE_URL}${path}`
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000)

  let response: Response

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers,
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(
        `Request timed out connecting to ${API_BASE_URL}. Ensure the portal is running (npm run dev) and your phone is on the same Wi‑Fi network.`
      )
    }

    const hint =
      Platform.OS === 'android'
        ? ' On a physical Android device, the API must use your PC LAN IP (not 10.0.2.2). Ensure npm run dev is running and your phone is on the same Wi‑Fi.'
        : ' Make sure the web portal is running (npm run dev in the project root).'
    throw new Error(`Cannot reach the server at ${API_BASE_URL}.${hint}`)
  } finally {
    clearTimeout(timeoutId)
  }

  const body = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(body?.message || 'Request failed')
  }

  return body as T
}

export function getLoginErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return 'Unable to sign in'
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function signInRequest(email: string, password: string) {
  return request<{ success: boolean; data: AuthPayload }>(
    '/api/users/login',
    {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }
  )
}

export async function signUpRequest(payload: SignUpParams) {
  return request<{ success: boolean; data: AuthPayload }>(
    '/api/users/register',
    {
      method: 'POST',
      body: JSON.stringify(payload)
    }
  )
}

export async function socialSignIn(provider: 'google' | 'microsoft', tokens: { idToken?: string; accessToken?: string }) {
  return request<{ success: boolean; data: AuthPayload }>(
    '/api/auth/social',
    {
      method: 'POST',
      body: JSON.stringify({ provider, ...tokens })
    }
  )
}

// ─── Onboarding ──────────────────────────────────────────────────────────────

export async function onboardUser(
  token: string,
  role: 'USER' | 'AGENCY' | 'INSTRUCTOR',
  gender?: 'MALE' | 'FEMALE'
) {
  return request<{ success: boolean; data: any }>(
    '/api/users/onboard',
    {
      method: 'POST',
      body: JSON.stringify({ role, gender }),
    },
    token
  )
}

// ─── Courses ─────────────────────────────────────────────────────────────────

export async function fetchCourses(token: string, mine = false) {
  const qs = mine ? '?mine=true' : ''
  return request<{ success: boolean; data: any[] }>(
    `/api/courses${qs}`,
    { method: 'GET' },
    token
  )
}

export async function fetchCourse(token: string, courseId: string) {
  return request<{ success: boolean; data: any }>(
    `/api/courses/${courseId}`,
    { method: 'GET' },
    token
  )
}

export async function createCourse(token: string, payload: {
  title: string
  description: string
  category?: string
  level?: string
  duration?: number
  durationLabel?: string
  scheduleDates?: string
  location?: string
  priceUSD?: number
  priceKES?: number
  currency?: string
  isPublished?: boolean
  isFeatured?: boolean
  requirements?: string
  whatYouLearn?: string
  keyBenefits?: string
  specialOffer?: string
  shortDescription?: string
}) {
  return request<{ success: boolean; data: any }>(
    '/api/courses',
    {
      method: 'POST',
      body: JSON.stringify({
        category: 'Professional Training',
        level: 'BEGINNER',
        duration: 0,
        priceUSD: 0,
        priceKES: 0,
        currency: 'KES',
        isPublished: false,
        isFeatured: false,
        ...payload,
      }),
    },
    token
  )
}

export async function updateCourse(token: string, courseId: string, payload: {
  title?: string
  description?: string
  shortDescription?: string
  durationLabel?: string
  scheduleDates?: string
  location?: string
  priceUSD?: number
  priceKES?: number
  currency?: string
  isPublished?: boolean
  isFeatured?: boolean
  requirements?: string
  whatYouLearn?: string
  keyBenefits?: string
  specialOffer?: string
  category?: string
  level?: string
  duration?: number
}) {
  return request<{ success: boolean; data: any }>(
    `/api/courses/${courseId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
    token
  )
}

export async function deleteCourse(token: string, courseId: string) {
  return request<{ success: boolean }>(
    `/api/courses/${courseId}`,
    { method: 'DELETE' },
    token
  )
}

export async function publishCourse(token: string, courseId: string) {
  return request<{ success: boolean }>(
    `/api/courses/${courseId}/publish`,
    { method: 'POST' },
    token
  )
}

export async function unpublishCourse(token: string, courseId: string) {
  return request<{ success: boolean }>(
    `/api/courses/${courseId}/unpublish`,
    { method: 'POST' },
    token
  )
}

// ─── Modules ─────────────────────────────────────────────────────────────────

export async function addModule(token: string, courseId: string, payload: { title: string; isMilestone?: boolean }) {
  return request<{ success: boolean; data: any }>(
    `/api/courses/${courseId}/modules`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    token
  )
}

export async function updateModule(token: string, courseId: string, moduleId: string, payload: { title?: string; isMilestone?: boolean }) {
  return request<{ success: boolean; data: any }>(
    `/api/courses/${courseId}/modules/${moduleId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
    token
  )
}

export async function deleteModule(token: string, courseId: string, moduleId: string) {
  return request<{ success: boolean }>(
    `/api/courses/${courseId}/modules/${moduleId}`,
    { method: 'DELETE' },
    token
  )
}

// ─── Lessons ─────────────────────────────────────────────────────────────────

export async function addLesson(
  token: string,
  courseId: string,
  moduleId: string,
  payload: { title: string; type: string; url?: string; isMilestone?: boolean; duration?: number }
) {
  return request<{ success: boolean; data: any }>(
    `/api/courses/${courseId}/modules/${moduleId}/lessons`,
    {
      method: 'POST',
      body: JSON.stringify({ duration: 0, ...payload }),
    },
    token
  )
}

export async function updateLesson(
  token: string,
  courseId: string,
  moduleId: string,
  lessonId: string,
  payload: { title?: string; type?: string; url?: string; isMilestone?: boolean; duration?: number }
) {
  return request<{ success: boolean; data: any }>(
    `/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
    token
  )
}

export async function deleteLesson(token: string, courseId: string, moduleId: string, lessonId: string) {
  return request<{ success: boolean }>(
    `/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`,
    { method: 'DELETE' },
    token
  )
}

// ─── Enrollments ─────────────────────────────────────────────────────────────

export async function fetchEnrollments(token: string) {
  return request<{ success: boolean; data: any[] }>(
    '/api/enrollments',
    { method: 'GET' },
    token
  )
}

export async function createEnrollment(token: string, courseId: string) {
  return request<{ success: boolean; data: any; message?: string }>(
    '/api/enrollments',
    {
      method: 'POST',
      body: JSON.stringify({ courseId }),
    },
    token
  )
}

// ─── Progress ────────────────────────────────────────────────────────────────

export async function fetchProgress(token: string, courseId?: string) {
  const qs = courseId ? `?courseId=${encodeURIComponent(courseId)}` : ''
  return request<{ success: boolean; data: any }>(
    `/api/progress${qs}`,
    { method: 'GET' },
    token
  )
}

export async function updateLessonProgress(
  token: string,
  lessonId: string,
  isCompleted: boolean
) {
  return request<{ success: boolean; data: any }>(
    '/api/progress',
    {
      method: 'POST',
      body: JSON.stringify({ lessonId, isCompleted }),
    },
    token
  )
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export async function fetchCurrentUser(token: string) {
  return request<{ success: boolean; data: any }>(
    '/api/users/me',
    { method: 'GET' },
    token
  )
}

export async function updateProfile(
  token: string,
  payload: {
    name?: string
    email?: string
    currentPassword?: string
    newPassword?: string
  }
) {
  return request<{ success: boolean; data: any; message?: string }>(
    '/api/users/me',
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
    token
  )
}

// ─── Agency ──────────────────────────────────────────────────────────────────

export async function fetchAgencyStats(token: string) {
  return request<{ success: boolean; data: any }>(
    '/api/agencies/stats',
    { method: 'GET' },
    token
  )
}

export async function fetchAvailableCaregivers(token: string) {
  return request<{ success: boolean; data: any[] }>(
    '/api/agencies/caregivers',
    { method: 'GET' },
    token
  )
}

export async function recruitCaregiver(token: string, caregiverId: string) {
  return request<{ success: boolean; data: any }>(
    '/api/agencies/caregivers',
    {
      method: 'POST',
      body: JSON.stringify({ caregiverId }),
    },
    token
  )
}

export async function searchCaregivers(token: string, query: string) {
  return request<{ success: boolean; data: any[] }>(
    `/api/agencies/caregivers/search?query=${encodeURIComponent(query)}`,
    { method: 'GET' },
    token
  )
}

export async function fetchRecruitedCaregivers(token: string) {
  return request<{ success: boolean; data: any[] }>(
    '/api/agencies/caregivers?recruited=true',
    { method: 'GET' },
    token
  )
}

export async function rateCaregiver(
  token: string,
  recruitmentId: string,
  rating: number,
  reviewComment?: string
) {
  return request<{ success: boolean; data: any }>(
    `/api/agencies/caregivers/${recruitmentId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ rating, reviewComment }),
    },
    token
  )
}

export async function sponsorCaregiver(
  token: string,
  caregiverId: string,
  courseId: string
) {
  return request<{ success: boolean; data: any; message?: string }>(
    '/api/agencies/sponsorships',
    {
      method: 'POST',
      body: JSON.stringify({ caregiverId, courseId }),
    },
    token
  )
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export async function fetchAdminUsers(
  token: string,
  params?: { search?: string; role?: string; page?: number; limit?: number }
) {
  const qs = new URLSearchParams()
  if (params?.search) qs.set('search', params.search)
  if (params?.role) qs.set('role', params.role)
  if (params?.page) qs.set('page', String(params.page))
  if (params?.limit) qs.set('limit', String(params.limit))
  const query = qs.toString()
  return request<{ success: boolean; data: { users: any[]; total: number; page: number; limit: number; totalPages: number } }>(
    `/api/admin/users${query ? `?${query}` : ''}`,
    { method: 'GET' },
    token
  )
}

export async function updateAdminUserRole(token: string, userId: string, role: string) {
  return request<{ success: boolean; data: any; message?: string }>(
    '/api/admin/users',
    {
      method: 'PATCH',
      body: JSON.stringify({ userId, role }),
    },
    token
  )
}

export async function fetchAdminStats(token: string) {
  return request<{ success: boolean; data: any }>(
    '/api/admin/stats',
    { method: 'GET' },
    token
  )
}
