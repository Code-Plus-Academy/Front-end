import supabase from './supabaseClient';
import api from '../api/axios';

/**
 * ─── Supabase Native TOTP MFA Helpers ──────────────────────────────────────────
 */

/**
 * Enroll a new TOTP MFA factor.
 * Returns { id, type, totp: { qr_code, secret, uri } }
 */
export async function enrollMFA() {
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    issuer: 'CodePlusAcademy',
  });
  if (error) throw error;
  return data;
}

/**
 * Challenge and verify a TOTP code during enrollment or login.
 */
export async function verifyMFA({ factorId, code }) {
  const cleanCode = String(code).trim();
  const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
    factorId,
  });
  if (challengeError) throw challengeError;

  const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challengeData.id,
    code: cleanCode,
  });
  if (verifyError) throw verifyError;
  return verifyData;
}

/**
 * Unenroll (disable) a TOTP MFA factor.
 */
export async function unenrollMFA({ factorId }) {
  const { data, error } = await supabase.auth.mfa.unenroll({
    factorId,
  });
  if (error) throw error;
  return data;
}

/**
 * List enrolled MFA factors for the current user.
 */
export async function getMFAFactors() {
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) throw error;
  return data || { all: [], totp: [] };
}

/**
 * Check current and next Authenticator Assurance Level (AAL).
 * Returns { currentLevel: 'aal1' | 'aal2', nextLevel: 'aal1' | 'aal2', currentAuthenticationMethods: [...] }
 */
export async function getAAL() {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) throw error;
  return data || { currentLevel: 'aal1', nextLevel: 'aal1' };
}

/**
 * Generate 8 secure random backup codes formatted as XXXX-XXXX
 */
export function generateBackupCodes(count = 8) {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const codes = [];
  for (let i = 0; i < count; i++) {
    let part1 = '';
    let part2 = '';
    for (let j = 0; j < 4; j++) {
      part1 += chars.charAt(Math.floor(Math.random() * chars.length));
      part2 += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    codes.push(`${part1}-${part2}`);
  }
  return codes;
}

/**
 * Save freshly generated backup codes to the server (hashed with bcrypt on backend).
 */
export async function saveBackupCodesToServer(codes) {
  const res = await api.post('/auth/mfa/save-backup-codes', { codes });
  return res.data;
}

/**
 * Verify an offline backup code against the backend database.
 */
export async function verifyBackupCodeOnServer(code, email = null) {
  const res = await api.post('/auth/mfa/verify-backup-code', { 
    code: String(code).trim().toUpperCase(),
    email 
  });
  return res.data;
}
