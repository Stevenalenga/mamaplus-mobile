import { decodeStringList, encodeStringList, textareaToStringList } from './course-fields'

export type ApiCourse = {
  id: string
  title: string
  description?: string | null
  shortDescription?: string | null
  category?: string | null
  duration?: number
  durationLabel?: string | null
  scheduleDates?: string | null
  location?: string | null
  currency?: string | null
  priceUSD?: number
  priceKES?: number
  isFeatured?: boolean
  isPublished?: boolean
  requirements?: string | null
  whatYouLearn?: string | null
  keyBenefits?: string | null
  specialOffer?: string | null
  modules?: Array<{ lessons?: Array<{ id: string }> }>
}

export function parseListField(value: string | null | undefined, fallback: string[] = []): string[] {
  const parsed = decodeStringList(value)
  return parsed.length > 0 ? parsed : fallback
}

export function formatDuration(minutes: number, lessonCount: number): string {
  if (lessonCount > 0) return `${lessonCount} lesson${lessonCount === 1 ? '' : 's'}`
  if (minutes >= 1440) return `${Math.round(minutes / 1440)} day${minutes >= 2880 ? 's' : ''}`
  if (minutes >= 60) return `${Math.round(minutes / 60)} hour${minutes >= 120 ? 's' : ''}`
  if (minutes > 0) return `${minutes} min`
  return 'Self-paced'
}

export function formatCoursePrice(course: Pick<ApiCourse, 'currency' | 'priceUSD' | 'priceKES'>): string {
  const currency = course.currency || 'USD'
  if (currency === 'KES') {
    const amount = course.priceKES ?? 0
    return amount <= 0 ? 'Free' : `KES ${amount.toLocaleString()}`
  }
  const amount = course.priceUSD ?? 0
  return amount <= 0 ? 'Free' : `$${amount}`
}

export function isFreeCourse(course: Pick<ApiCourse, 'priceUSD' | 'priceKES'>): boolean {
  return (course.priceKES ?? 0) <= 0 && (course.priceUSD ?? 0) <= 0
}

export function getCourseOverview(course: ApiCourse): string {
  return course.shortDescription || course.description || 'Professional training course from MamaPlus.'
}

export function getCourseDurationLabel(course: ApiCourse): string {
  const lessonCount = (course.modules || []).reduce(
    (sum, module) => sum + (module.lessons?.length || 0),
    0,
  )
  return course.durationLabel || formatDuration(course.duration || 0, lessonCount)
}

export type CourseFormState = {
  title: string
  description: string
  durationLabel: string
  scheduleDates: string
  location: string
  currency: 'USD' | 'KES'
  price: string
  targetAudienceText: string
  learningObjectivesText: string
  keyBenefitsText: string
  isFeatured: boolean
}

export const emptyCourseForm: CourseFormState = {
  title: '',
  description: '',
  durationLabel: '',
  scheduleDates: '',
  location: '',
  currency: 'KES',
  price: '',
  targetAudienceText: '',
  learningObjectivesText: '',
  keyBenefitsText: '',
  isFeatured: false,
}

export function courseFormFromApi(course: ApiCourse): CourseFormState {
  const currency = course.currency === 'USD' ? 'USD' : 'KES'
  return {
    title: course.title,
    description: course.description || '',
    durationLabel: course.durationLabel || '',
    scheduleDates: course.scheduleDates || '',
    location: course.location || '',
    currency,
    price: String(currency === 'USD' ? course.priceUSD ?? 0 : course.priceKES ?? 0),
    targetAudienceText: parseListField(course.requirements).join('\n'),
    learningObjectivesText: parseListField(course.whatYouLearn).join('\n'),
    keyBenefitsText: parseListField(course.keyBenefits).join('\n'),
    isFeatured: !!course.isFeatured,
  }
}

export function buildCoursePayload(form: CourseFormState) {
  const price = parseFloat(form.price) || 0

  return {
    title: form.title.trim(),
    description: form.description.trim(),
    durationLabel: form.durationLabel.trim(),
    scheduleDates: form.scheduleDates.trim(),
    location: form.location.trim(),
    currency: form.currency,
    priceUSD: form.currency === 'USD' ? price : 0,
    priceKES: form.currency === 'KES' ? price : 0,
    requirements: encodeStringList(textareaToStringList(form.targetAudienceText)),
    whatYouLearn: encodeStringList(textareaToStringList(form.learningObjectivesText)),
    keyBenefits: encodeStringList(textareaToStringList(form.keyBenefitsText)),
    isFeatured: form.isFeatured,
    category: 'Professional Training',
    level: 'BEGINNER',
    duration: 0,
  }
}
