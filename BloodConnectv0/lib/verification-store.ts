// Simple in-memory store for verification codes
// In production, this should be replaced with a proper database
const verificationStore = new Map<string, { code: string; expires: number }>()

// Clean up expired codes every minute
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of verificationStore.entries()) {
    if (value.expires < now) {
      verificationStore.delete(key)
    }
  }
}, 60000)

export function storeVerificationCode(phoneNumber: string, code: string) {
  const expires = Date.now() + 10 * 60 * 1000 // 10 minutes
  verificationStore.set(phoneNumber, { code, expires })
}

export function getVerificationCode(phoneNumber: string): string | null {
  const data = verificationStore.get(phoneNumber)
  if (!data) return null
  if (data.expires < Date.now()) {
    verificationStore.delete(phoneNumber)
    return null
  }
  return data.code
}

export function deleteVerificationCode(phoneNumber: string) {
  verificationStore.delete(phoneNumber)
} 