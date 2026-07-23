// Phone/email validation — mirrors the web app (mamaplus/lib/validation.ts)

import { getPhoneCountry, type PhoneCountry } from './phone-countries'

/**
 * Formats a national phone number with country dial code (E.164 without +).
 */
export function formatInternationalPhoneNumber(nationalNumber: string, dialCode: string): string {
  let cleaned = nationalNumber.replace(/\D/g, '')

  if (cleaned.startsWith('0')) {
    cleaned = cleaned.slice(1)
  }

  if (cleaned.startsWith(dialCode)) {
    return cleaned
  }

  return dialCode + cleaned
}

/**
 * Validates a national phone number for a selected country.
 */
export function validatePhoneForCountry(nationalNumber: string, country: PhoneCountry): boolean {
  let cleaned = nationalNumber.replace(/\D/g, '')

  if (!cleaned) {
    return false
  }

  if (cleaned.startsWith('0')) {
    cleaned = cleaned.slice(1)
  }

  if (cleaned.startsWith(country.dialCode)) {
    cleaned = cleaned.slice(country.dialCode.length)
  }

  return (
    /^\d+$/.test(cleaned) &&
    cleaned.length >= country.minLength &&
    cleaned.length <= country.maxLength
  )
}

/**
 * Validates Kenyan phone numbers for M-Pesa and Airtel Money.
 * Format: 254XXXXXXXXX (12 digits total).
 */
export function validateKenyanPhoneNumber(phone: string): boolean {
  return /^254[17]\d{8}$/.test(phone.replace(/\s+/g, ''))
}

/**
 * Validate and format a profile/registration phone number.
 */
export function validateAndFormatProfilePhone(
  nationalNumber: string,
  countryCode: string
): { success: true; phoneNumber: string } | { success: false; message: string } {
  const country = getPhoneCountry(countryCode)

  if (!validatePhoneForCountry(nationalNumber, country)) {
    return {
      success: false,
      message: `Please enter a valid ${country.name} phone number`,
    }
  }

  const formattedPhone = formatInternationalPhoneNumber(nationalNumber, country.dialCode)

  if (countryCode === 'KE' && !validateKenyanPhoneNumber(formattedPhone)) {
    return {
      success: false,
      message: 'Please enter a valid Kenyan mobile number',
    }
  }

  return { success: true, phoneNumber: formattedPhone }
}

/** Same email format check the web signup page uses. */
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
