export const LOG_DEBUG = process.env.EXPO_PUBLIC_LOG_DEBUG || ''
export const LOG_LEVEL = (process.env.EXPO_PUBLIC_LOG_LEVEL || 'info') as
  | 'debug'
  | 'info'
  | 'warn'
  | 'error'
export const NEXT_PUBLIC_ONCHAINKIT_API_KEY =
  process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY
