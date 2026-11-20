/**
 * Centralised public Android distribution destinations.
 *
 * Configure NEXT_PUBLIC_PHONEPE_APPSTORE_URL per deployment when the listing
 * changes. The fallback is the PhonePe Appstore URL supplied for FocusGram.
 */
export const PHONEPE_APPSTORE_URL =
  process.env.NEXT_PUBLIC_PHONEPE_APPSTORE_URL?.trim() ||
  'https://indusapp.store/0ae2to7v';
