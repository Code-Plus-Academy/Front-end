import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowRight, Check, CheckCircle2, Loader2, Mail, RefreshCw, ShieldAlert, Upload, X } from 'lucide-react';
import AuthTerminalLayout from '../../components/layout/AuthTerminalLayout';
import VantaNetBackground from '../../components/layout/VantaNetBackground';
import StepProgressBar from '../../components/auth/registration/StepProgressBar';
import ProfilePreviewCard from '../../components/auth/registration/ProfilePreviewCard';
import InterestPicker from '../../components/auth/registration/InterestPicker';
import api, { getErrorMessage } from '../../api/axios';
import {
  ACCOUNT_TYPES,
  PROFESSIONAL_TYPES,
  INTEREST_CATEGORIES,
  MIN_INTERESTS,
  MAX_INTERESTS,
  EMAIL_REGEX,
  USERNAME_REGEX,
  PASSWORD_REGEX,
} from '../../constants/registration';
import { useAuth } from '../../context/AuthContext';
import { getRedirectTarget } from '../../utils/navigation';

const initialDraft = {
  email: '',
  password: '',
  confirmPassword: '',
  name: '',
  username: '',
  account_type: 'personal',
  professional_subtype: 'creator',
  privacy_setting: false,
  bio: '',
  avatar_url: null,
  banner_url: null,
  date_of_birth: '',
  terms_privacy_consent: false,
};

const apiErrorShape = (error) => {
  const payload = error?.response?.data?.error;
  if (payload && typeof payload === 'object') return payload;
  if (typeof payload === 'string') return { code: payload, message: error?.response?.data?.message || 'Request failed.' };
  return { code: 'UNKNOWN_ERROR', message: getErrorMessage(error) };
};

const normalizeSlugList = (items = []) => items.map((item) => (typeof item === 'string' ? item : item?.slug)).filter(Boolean);

const summaryToDraft = (summary) => ({
  name: summary?.name || '',
  username: summary?.username || '',
  account_type: summary?.account_type || 'personal',
  professional_subtype: summary?.professional_subtype || 'creator',
  privacy_setting: !!summary?.privacy_setting,
  bio: summary?.bio || '',
  avatar_url: summary?.avatar_url || null,
  banner_url: summary?.banner_url || null,
});

export default function RegisterFlow() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshUser } = useAuth();
  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  const privacyBackupRef = useRef(false);
  const subtypeBackupRef = useRef('creator');

  const [loadingStatus, setLoadingStatus] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState('');
  const [usernameState, setUsernameState] = useState({ status: 'idle', message: '' });
  const [profileCompletion, setProfileCompletion] = useState({ percent: 0, completed: 0, total: 9 });
  const [summary, setSummary] = useState(null);
  const [draft, setDraft] = useState(initialDraft);
  const [selectedInterests, setSelectedInterests] = useState(new Set());
  const [uploadState, setUploadState] = useState({ avatar: 'idle', banner: 'idle' });
  const [uploadError, setUploadError] = useState({ avatar: '', banner: '' });
  const [completeState, setCompleteState] = useState('idle');
  const [completeError, setCompleteError] = useState('');
  const [completeAttempt, setCompleteAttempt] = useState(0);
  const [parentEmail, setParentEmail] = useState('');
  const [parentRequestSent, setParentRequestSent] = useState(false);
  const [parentRequestLoading, setParentRequestLoading] = useState(false);
  const [parentRequestError, setParentRequestError] = useState('');

  // Step 2 OTP state
  const [otpCode, setOtpCode] = useState('');
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendBusy, setResendBusy] = useState(false);
  const [resendNotice, setResendNotice] = useState('');

  const selectedInterestCount = selectedInterests.size;
  const emailVerifiedNotice = searchParams.get('verified') === '1' || !!summary?.email_verified;
  const selectedInterestObjects = useMemo(() => {
    const map = new Map();
    for (const category of INTEREST_CATEGORIES) {
      for (const item of category.items) map.set(item.slug, { ...item, category: category.category });
    }
    return normalizeSlugList([...selectedInterests]).map((slug) => map.get(slug) || { slug });
  }, [selectedInterests]);

  const setField = (key, value) => setDraft((prev) => ({ ...prev, [key]: value }));
  const resetErrors = () => {
    setErrors({});
    setOtpError('');
  };

  const hydrateFromSummary = (data) => {
    if (!data) return;
    setSummary(data);
    setDraft((prev) => ({ ...prev, ...summaryToDraft(data), email: data.email || prev.email }));
    setSelectedInterests(new Set(normalizeSlugList(data.interests)));
    setProfileCompletion(data.profile_completion || { percent: 0, completed: 0, total: 9 });
  };

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await api.get('/auth/register/status');
        if (!active) return;
        const data = res.data || {};
        if (data.completed) {
          navigate('/feed', { replace: true });
          return;
        }
        if (data.in_progress) {
          hydrateFromSummary(data.summary);
          const nextStep = data.summary?.email_verified
            ? Math.max(data.onboarding_step || 3, 3)
            : Math.min(Math.max(data.onboarding_step || 2, 2), 7);
          setCurrentStep(nextStep);
          setProfileCompletion(data.profile_completion || { percent: 0, completed: 0, total: 9 });
        }
      } catch {
        // No active signup session, stay on step 1.
      } finally {
        if (active) setLoadingStatus(false);
      }
    };
    load();
    return () => { active = false; };
  }, [navigate]);

  // Username availability check (Step 3)
  useEffect(() => {
    if (currentStep !== 3) return undefined;
    const username = draft.username.trim().toLowerCase().replace(/^@/, '');
    if (!username) {
      setUsernameState({ status: 'idle', message: '' });
      return undefined;
    }
    if (!USERNAME_REGEX.test(username)) {
      setUsernameState({ status: 'invalid', message: 'Use 3-30 letters, numbers, or underscores.' });
      return undefined;
    }

    let cancelled = false;
    setUsernameState({ status: 'checking', message: 'Checking availability…' });
    const timer = setTimeout(async () => {
      try {
        const res = await api.get('/auth/register/username-available', { params: { username } });
        if (cancelled) return;
        setUsernameState(res.data?.available ? { status: 'available', message: 'Available' } : { status: 'taken', message: 'Taken' });
      } catch (error) {
        if (!cancelled) setUsernameState({ status: 'error', message: getErrorMessage(error) });
      }
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [currentStep, draft.username]);

  // Final Step 7 complete
  useEffect(() => {
    if (currentStep !== 7) return undefined;
    let cancelled = false;
    const finalize = async () => {
      setCompleteState('loading');
      setCompleteError('');
      try {
        const res = await api.post('/auth/register/complete');
        if (cancelled) return;
        if (res.data?.summary) setSummary(res.data.summary);
        if (res.data?.profile_completion) setProfileCompletion(res.data.profile_completion);
        setCompleteState('success');
        await refreshUser();
        const target = getRedirectTarget(window.location.search, '/feed');
        if (target.startsWith('http://') || target.startsWith('https://')) {
          window.location.href = target;
        } else {
          navigate(target, { replace: true });
        }
      } catch (error) {
        if (!cancelled) {
          setCompleteState('error');
          setCompleteError(getErrorMessage(error));
        }
      }
    };
    finalize();
    return () => { cancelled = true; };
  }, [currentStep, completeAttempt, navigate, refreshUser]);

  const refreshStatus = useCallback(async () => {
    try {
      const res = await api.get('/auth/register/status');
      const data = res.data || {};
      if (data.in_progress) {
        hydrateFromSummary(data.summary);
        if (data.summary?.email_verified && currentStep === 2) {
          setOtpSuccess('Email verified! Moving to identity step...');
          setTimeout(() => setCurrentStep(3), 800);
        }
        return data.summary;
      }
    } catch (err) {
      console.error('Failed to refresh registration status:', err);
    }
    return null;
  }, [currentStep]);

  useEffect(() => {
    const handleFocus = async () => {
      if ((currentStep === 2 || currentStep === 7) && !busy) {
        const summaryData = await refreshStatus();
        if (summaryData?.email_verified && currentStep === 2) {
          setCurrentStep(3);
        }
        if (summaryData?.email_verified && currentStep === 7 && completeState === 'error') {
          setCompleteAttempt((v) => v + 1);
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [currentStep, busy, completeState, refreshStatus]);

  const mapFieldError = (error) => {
    const shape = apiErrorShape(error);
    if (shape.field) setErrors((prev) => ({ ...prev, [shape.field]: shape.message }));
    return shape;
  };

  const handleVerifyOtp = async (codeToVerify) => {
    const code = (codeToVerify || otpCode).trim();
    if (!code || code.length !== 6) {
      setOtpError('Please enter a valid 6-digit verification code.');
      return;
    }
    setOtpBusy(true);
    setOtpError('');
    setOtpSuccess('');

    try {
      const targetEmail = draft.email || summary?.email;
      const res = await api.post('/auth/verify-email-otp', { email: targetEmail, otp: code });
      if (res.data?.verified) {
        setOtpSuccess('Verification successful!');
        await refreshUser();
        await refreshStatus();
        setTimeout(() => {
          setCurrentStep(3);
        }, 600);
      }
    } catch (err) {
      setOtpError(getErrorMessage(err) || 'Invalid or expired code. Please try again.');
    } finally {
      setOtpBusy(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resendBusy) return;
    const targetEmail = draft.email || summary?.email;
    if (!targetEmail) return;

    setResendBusy(true);
    setResendNotice('');
    setOtpError('');
    try {
      await api.post('/auth/resend-verification', { email: targetEmail });
      setResendNotice('New 6-digit code and link sent to your email!');
      setResendCooldown(45);
    } catch (err) {
      setOtpError('Failed to resend code. Please try again.');
    } finally {
      setResendBusy(false);
    }
  };

  const validateStep1 = () => {
    const next = {};
    if (!EMAIL_REGEX.test(draft.email.trim())) next.email = 'Enter a valid email address.';
    if (!PASSWORD_REGEX.test(draft.password)) next.password = 'Use 8+ characters with upper, lower, number, and special character.';
    if (draft.password !== draft.confirmPassword) next.confirmPassword = 'Passwords do not match.';
    if (!draft.date_of_birth) next.date_of_birth = 'Date of birth is required.';
    if (!draft.terms_privacy_consent) next.terms_privacy_consent = 'You must accept the Terms & Conditions and Privacy Policy.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateStep3 = () => {
    const next = {};
    if (!draft.name.trim()) next.full_name = 'Full name is required.';
    if (draft.name.trim().length > 80) next.full_name = 'Full name must be 80 characters or less.';
    const username = draft.username.trim().replace(/^@/, '');
    if (!USERNAME_REGEX.test(username)) next.username = 'Use 3-30 letters, numbers, or underscores.';
    if (usernameState.status === 'taken') next.username = 'That username is already taken.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateStep4 = () => {
    const next = {};
    if (!ACCOUNT_TYPES.includes(draft.account_type)) next.account_type = 'Choose personal or professional.';
    if (draft.account_type === 'professional' && !PROFESSIONAL_TYPES.includes(draft.professional_subtype)) next.professional_subtype = 'Choose creator or business.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateStep5 = () => {
    if (uploadState.avatar === 'uploading' || uploadState.banner === 'uploading') {
      setErrors({ profile: 'Wait for uploads to finish before continuing.' });
      return false;
    }
    if ((uploadError.avatar && !draft.avatar_url) || (uploadError.banner && !draft.banner_url)) {
      setErrors({ profile: 'Resolve the upload error or skip the image before continuing.' });
      return false;
    }
    setErrors({});
    return true;
  };

  const validateStep6 = () => {
    const next = {};
    if (selectedInterestCount < MIN_INTERESTS) next.interests = `Select at least ${MIN_INTERESTS} interests.`;
    if (selectedInterestCount > MAX_INTERESTS) next.interests = `Select no more than ${MAX_INTERESTS} interests.`;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const saveProfileUpload = async (field, value) => {
    const res = await api.patch('/auth/register/profile', { [field]: value });
    if (res.data?.summary) hydrateFromSummary(res.data.summary);
    if (res.data?.profile_completion) setProfileCompletion(res.data.profile_completion);
  };

  const uploadImage = async (kind, file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError((prev) => ({ ...prev, [kind]: 'Only images are allowed.' }));
      return;
    }
    const maxSize = kind === 'avatar' ? 5 : 10;
    if (file.size > maxSize * 1024 * 1024) {
      setUploadError((prev) => ({ ...prev, [kind]: `Maximum ${maxSize} MB.` }));
      return;
    }

    setUploadError((prev) => ({ ...prev, [kind]: '' }));
    setUploadState((prev) => ({ ...prev, [kind]: 'uploading' }));
    try {
      const fd = new FormData();
      fd.append('file', file);
      if (kind === 'banner') fd.append('folder', 'banners');
      const endpoint = kind === 'avatar' ? '/upload/avatar' : '/upload/media';
      const res = await api.post(endpoint, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = kind === 'avatar' ? res.data.avatar_url : res.data.url;
      setField(kind === 'avatar' ? 'avatar_url' : 'banner_url', url);
      await saveProfileUpload(kind === 'avatar' ? 'avatar_url' : 'banner_url', url);
    } catch (error) {
      setUploadError((prev) => ({ ...prev, [kind]: getErrorMessage(error) }));
    } finally {
      setUploadState((prev) => ({ ...prev, [kind]: 'idle' }));
    }
  };

  const handleSkipImage = async (kind) => {
    setUploadError((prev) => ({ ...prev, [kind]: '' }));
    setField(kind === 'avatar' ? 'avatar_url' : 'banner_url', null);
    try {
      await saveProfileUpload(kind === 'avatar' ? 'avatar_url' : 'banner_url', null);
    } catch (error) {
      mapFieldError(error);
    }
  };

  const toggleInterest = (slug) => {
    setSelectedInterests((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else if (next.size < MAX_INTERESTS) next.add(slug);
      return next;
    });
    setErrors((prev) => ({ ...prev, interests: '' }));
  };

  const stepTitle = {
    1: 'Create your account',
    2: 'Verify your email address',
    3: 'Confirm identity',
    4: 'Choose your account type',
    5: 'Build your profile',
    6: 'Select interests',
    7: 'Setting up your account',
  }[currentStep] || 'Registration';

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (busy || completeState === 'loading') return;
    setNotice('');
    resetErrors();

    try {
      if (currentStep === 1) {
        if (!validateStep1()) return;
        setBusy(true);
        const res = await api.post('/auth/register/start', {
          email: draft.email.trim(),
          password: draft.password,
          date_of_birth: draft.date_of_birth,
          terms_privacy_consent: draft.terms_privacy_consent
        });
        if (res.data?.summary) hydrateFromSummary(res.data.summary);
        if (res.data?.profile_completion) setProfileCompletion(res.data.profile_completion);
        setDraft((prev) => ({ ...prev, password: '', confirmPassword: '' }));
        await refreshUser();
        setResendCooldown(45);
        setCurrentStep(2);
      } else if (currentStep === 2) {
        if (summary?.email_verified) {
          setCurrentStep(3);
        } else {
          await handleVerifyOtp();
        }
      } else if (currentStep === 3) {
        if (!validateStep3()) return;
        setBusy(true);
        const res = await api.patch('/auth/register/identity', {
          full_name: draft.name.trim(),
          username: draft.username.trim().replace(/^@/, '').toLowerCase(),
        });
        if (res.data?.summary) hydrateFromSummary(res.data.summary);
        if (res.data?.profile_completion) setProfileCompletion(res.data.profile_completion);
        setCurrentStep(res.data?.onboarding_step || 4);
      } else if (currentStep === 4) {
        if (!validateStep4()) return;
        setBusy(true);
        const res = await api.patch('/auth/register/account-type', {
          account_type: draft.account_type,
          privacy_setting: draft.privacy_setting,
          professional_subtype: draft.account_type === 'professional' ? draft.professional_subtype : null,
        });
        if (res.data?.summary) hydrateFromSummary(res.data.summary);
        if (res.data?.profile_completion) setProfileCompletion(res.data.profile_completion);
        setCurrentStep(res.data?.onboarding_step || 5);
      } else if (currentStep === 5) {
        if (!validateStep5()) return;
        setBusy(true);
        const res = await api.patch('/auth/register/profile', {
          bio: draft.bio,
          avatar_url: draft.avatar_url,
          banner_url: draft.banner_url,
        });
        if (res.data?.summary) hydrateFromSummary(res.data.summary);
        if (res.data?.profile_completion) setProfileCompletion(res.data.profile_completion);
        setCurrentStep(res.data?.onboarding_step || 6);
      } else if (currentStep === 6) {
        if (!validateStep6()) return;
        setBusy(true);
        const res = await api.patch('/auth/register/interests', { interests: [...selectedInterests] });
        if (res.data?.summary) hydrateFromSummary(res.data.summary);
        if (res.data?.profile_completion) setProfileCompletion(res.data.profile_completion);
        setCurrentStep(res.data?.onboarding_step || 7);
      } else if (currentStep === 7) {
        setCompleteAttempt((v) => v + 1);
      }
    } catch (error) {
      const shape = mapFieldError(error);
      if (!shape.field) setNotice(shape.message);
      if (shape.code === 'EMAIL_EXISTS') setNotice('An account with this email already exists.');
    } finally {
      setBusy(false);
    }
  };

  const renderStep = () => {
    if (currentStep === 1) {
      return (
        <div className="reg-grid">
          <div className="auth-field" style={{ gridColumn: 'span 2' }}>
            <label className="auth-label">Email</label>
            <div className="auth-input-wrap">
              <span className="auth-prompt">&gt;</span>
              <input className="auth-input" type="email" value={draft.email} onChange={(e) => setField('email', e.target.value)} placeholder="developer@domain.com" autoComplete="email" />
            </div>
            {errors.email && <p className="reg-error">{errors.email}</p>}
          </div>
          <div className="auth-field">
            <label className="auth-label">Password</label>
            <div className="auth-input-wrap">
              <span className="auth-prompt">&gt;</span>
              <input className="auth-input" type="password" value={draft.password} onChange={(e) => setField('password', e.target.value)} placeholder="••••••••" autoComplete="new-password" />
            </div>
            {errors.password && <p className="reg-error">{errors.password}</p>}
          </div>
          <div className="auth-field">
            <label className="auth-label">Confirm password</label>
            <div className="auth-input-wrap">
              <span className="auth-prompt">&gt;</span>
              <input className="auth-input" type="password" value={draft.confirmPassword} onChange={(e) => setField('confirmPassword', e.target.value)} placeholder="••••••••" autoComplete="new-password" />
            </div>
            {errors.confirmPassword && <p className="reg-error">{errors.confirmPassword}</p>}
          </div>
          <div className="auth-field" style={{ gridColumn: 'span 2' }}>
            <label className="auth-label">Date of birth</label>
            <div className="auth-input-wrap">
              <span className="auth-prompt">&gt;</span>
              <input className="auth-input" type="date" value={draft.date_of_birth} onChange={(e) => setField('date_of_birth', e.target.value)} />
            </div>
            {errors.date_of_birth && <p className="reg-error">{errors.date_of_birth}</p>}
          </div>
          <div className="auth-field" style={{ gridColumn: 'span 2', marginTop: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#f5f5f7' }}>
              <input
                type="checkbox"
                checked={draft.terms_privacy_consent}
                onChange={(e) => setField('terms_privacy_consent', e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <span>
                I agree to the <Link to="/terms" target="_blank" style={{ color: '#8a2bff', textDecoration: 'underline' }}>Terms & Conditions</Link> and <Link to="/privacy" target="_blank" style={{ color: '#8a2bff', textDecoration: 'underline' }}>Privacy Policy</Link>
              </span>
            </label>
            {errors.terms_privacy_consent && <p className="reg-error">{errors.terms_privacy_consent}</p>}
          </div>
          {notice && <div className="reg-banner reg-banner-error" style={{ gridColumn: 'span 2' }}><AlertCircle size={16} /><span>{notice}</span>{notice.includes('already exists') && <Link to="/login">Login</Link>}</div>}
        </div>
      );
    }

    if (currentStep === 2) {
      const activeEmail = draft.email || summary?.email || 'your email';
      const isVerified = summary?.email_verified;

      return (
        <div className="reg-stack" style={{ maxWidth: 520, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(110,0,255,0.12)', border: '1px solid rgba(110,0,255,0.3)', display: 'grid', placeItems: 'center', margin: '0 auto 12px', color: '#a855f7' }}>
              <Mail size={26} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 6px', color: '#fff' }}>Verify your email</h3>
            <p style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.5, margin: 0 }}>
              We sent a 6-digit code and a verification link to <strong style={{ color: '#f3f4f6' }}>{activeEmail}</strong>
            </p>
          </div>

          {isVerified ? (
            <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 12, padding: 20, textAlign: 'center' }}>
              <CheckCircle2 size={32} style={{ color: '#22c55e', margin: '0 auto 8px' }} />
              <h4 style={{ margin: '0 0 4px', color: '#22c55e', fontSize: 16 }}>Email Verified!</h4>
              <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>Your email is confirmed. Click continue below to build your profile.</p>
            </div>
          ) : (
            <>
              {/* Option A: Enter 6-digit OTP */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 20 }}>
                <label className="auth-label" style={{ textAlign: 'center', display: 'block', marginBottom: 10 }}>
                  Enter 6-Digit Code
                </label>
                <div className="auth-input-wrap" style={{ maxWidth: 280, margin: '0 auto 12px' }}>
                  <span className="auth-prompt">&gt;</span>
                  <input
                    className="auth-input"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtpCode(val);
                      setOtpError('');
                      if (val.length === 6) {
                        handleVerifyOtp(val);
                      }
                    }}
                    placeholder="123456"
                    style={{ letterSpacing: '8px', fontSize: 20, fontWeight: 700, textAlign: 'center' }}
                    autoFocus
                  />
                </div>

                <div style={{ textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={() => handleVerifyOtp()}
                    disabled={otpBusy || otpCode.length !== 6}
                    className="auth-btn-primary"
                    style={{ width: '100%', maxWidth: 280, margin: '0 auto', justifyContent: 'center' }}
                  >
                    {otpBusy ? <Loader2 size={16} className="spin" /> : <Check size={16} />}
                    <span>{otpBusy ? 'Verifying...' : 'Verify Code'}</span>
                  </button>
                </div>

                {otpError && <p className="reg-error" style={{ textAlign: 'center', marginTop: 10 }}>{otpError}</p>}
                {otpSuccess && <p style={{ color: '#22c55e', fontSize: 12, textAlign: 'center', marginTop: 10, fontWeight: 600 }}>{otpSuccess}</p>}
              </div>

              {/* Option B: Link or Check Status */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <RefreshCw size={14} style={{ color: '#9ca3af' }} />
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>Clicked link in email?</span>
                </div>
                <button
                  type="button"
                  onClick={refreshStatus}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Check Status
                </button>
              </div>

              {/* Resend Action with Cooldown */}
              <div style={{ textAlign: 'center', marginTop: 8 }}>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || resendBusy}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: resendCooldown > 0 ? '#6b7280' : '#a855f7',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                    textDecoration: resendCooldown > 0 ? 'none' : 'underline',
                  }}
                >
                  {resendBusy ? 'Sending code...' : resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend verification code & link'}
                </button>
                {resendNotice && <p style={{ color: '#22c55e', fontSize: 11, margin: '6px 0 0' }}>{resendNotice}</p>}
              </div>
            </>
          )}
        </div>
      );
    }

    if (currentStep === 3) {
      return (
        <div className="reg-grid">
          <div className="auth-field">
            <label className="auth-label">Full name</label>
            <div className="auth-input-wrap">
              <span className="auth-prompt">&gt;</span>
              <input className="auth-input" value={draft.name} onChange={(e) => setField('name', e.target.value)} placeholder="Your public name" autoComplete="name" />
            </div>
            {errors.full_name && <p className="reg-error">{errors.full_name}</p>}
          </div>
          <div className="auth-field">
            <label className="auth-label">Username</label>
            <div className="auth-input-wrap">
              <span className="auth-prompt">@</span>
              <input className="auth-input" value={draft.username} onChange={(e) => setField('username', e.target.value.replace(/^@/, '').toLowerCase())} placeholder="your_handle" autoComplete="username" />
            </div>
            <div className={`reg-status ${usernameState.status}`}>
              {usernameState.status === 'checking' && <Loader2 size={12} className="spin" />}
              {usernameState.status === 'available' && <Check size={12} />}
              {usernameState.status === 'taken' && <X size={12} />}
              {usernameState.message && <span>{usernameState.message}</span>}
            </div>
            {errors.username && <p className="reg-error">{errors.username}</p>}
          </div>
        </div>
      );
    }

    if (currentStep === 4) {
      return (
        <div className="reg-stack">
          <div className="choice-grid">
            {ACCOUNT_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                className={`choice-card ${draft.account_type === type ? 'is-selected' : ''}`}
                onClick={() => {
                  if (type === 'personal') {
                    subtypeBackupRef.current = draft.professional_subtype;
                    setDraft((prev) => ({ ...prev, account_type: 'personal', privacy_setting: privacyBackupRef.current }));
                  } else {
                    privacyBackupRef.current = draft.privacy_setting;
                    setDraft((prev) => ({ ...prev, account_type: 'professional', professional_subtype: prev.professional_subtype || subtypeBackupRef.current || 'creator', privacy_setting: prev.privacy_setting ?? false }));
                  }
                  setErrors((prev) => ({ ...prev, account_type: '', professional_subtype: '' }));
                }}
              >
                <span>{type}</span>
                <small>{type === 'personal' ? 'Private or public visibility' : 'Public by default'}</small>
              </button>
            ))}
          </div>
          <div className="privacy-row">
            <div>
              <div className="auth-label">Privacy setting</div>
              <p className="reg-helper">Professional accounts default to public, but you can switch to private.</p>
            </div>
            <button type="button" className={`toggle-pill ${draft.privacy_setting ? 'on' : 'off'}`} onClick={() => setDraft((prev) => ({ ...prev, privacy_setting: !prev.privacy_setting }))}>
              <span>{draft.privacy_setting ? 'Private' : 'Public'}</span>
            </button>
          </div>
          {draft.account_type === 'professional' && <div className="reg-banner"><ShieldAlert size={16} /><span>Professional accounts are public by default.</span></div>}
          {draft.account_type === 'professional' && <div className="subtype-grid">{PROFESSIONAL_TYPES.map((type) => <button key={type} type="button" className={`choice-chip ${draft.professional_subtype === type ? 'is-selected' : ''}`} onClick={() => setDraft((prev) => ({ ...prev, professional_subtype: type }))}>{type}</button>)}</div>}
          {(errors.account_type || errors.professional_subtype) && <p className="reg-error">{errors.account_type || errors.professional_subtype}</p>}
        </div>
      );
    }

    if (currentStep === 5) {
      return (
        <div className="profile-grid">
          <div className="profile-form">
            <div className="profile-block">
              <div className="profile-block-head">
                <div>
                  <label className="auth-label">Profile picture</label>
                  <p className="reg-helper">Optional. Upload now or skip for later.</p>
                </div>
                <div className="profile-actions">
                  <button type="button" className="link-btn" onClick={() => avatarInputRef.current?.click()}><Upload size={14} /> Upload</button>
                  <button type="button" className="link-btn" onClick={() => handleSkipImage('avatar')}>Skip for now</button>
                </div>
              </div>
              <input ref={avatarInputRef} hidden type="file" accept="image/*" onChange={(e) => uploadImage('avatar', e.target.files?.[0])} />
              {uploadError.avatar && <p className="reg-error">{uploadError.avatar}</p>}
              {uploadState.avatar === 'uploading' && <p className="reg-status checking"><Loader2 size={12} className="spin" /> Uploading avatar…</p>}
            </div>
            <div className="profile-block">
              <div className="profile-block-head">
                <div>
                  <label className="auth-label">Banner</label>
                  <p className="reg-helper">Optional. Use a cover image if you have one.</p>
                </div>
                <div className="profile-actions">
                  <button type="button" className="link-btn" onClick={() => bannerInputRef.current?.click()}><Upload size={14} /> Upload</button>
                  <button type="button" className="link-btn" onClick={() => handleSkipImage('banner')}>Skip for now</button>
                </div>
              </div>
              <input ref={bannerInputRef} hidden type="file" accept="image/*" onChange={(e) => uploadImage('banner', e.target.files?.[0])} />
              {uploadError.banner && <p className="reg-error">{uploadError.banner}</p>}
              {uploadState.banner === 'uploading' && <p className="reg-status checking"><Loader2 size={12} className="spin" /> Uploading banner…</p>}
            </div>
            <div className="auth-field">
              <label className="auth-label">Bio</label>
              <textarea className="auth-textarea" value={draft.bio} onChange={(e) => setField('bio', e.target.value)} placeholder="Tell people what you are building" maxLength={300} />
              <p className="reg-helper">A short bio helps people understand what you’re working on.</p>
              {errors.bio && <p className="reg-error">{errors.bio}</p>}
            </div>
            {errors.profile && <div className="reg-banner reg-banner-error"><AlertCircle size={16} /><span>{errors.profile}</span></div>}
          </div>
          <ProfilePreviewCard user={{ ...draft, interests: selectedInterestObjects }} />
        </div>
      );
    }

    if (currentStep === 6) {
      return (
        <div className="reg-stack">
          <div className="reg-counter">
            <span>{selectedInterestCount} of {MIN_INTERESTS} minimum selected</span>
            <span>{selectedInterestCount} / {MAX_INTERESTS}</span>
          </div>
          <InterestPicker categories={INTEREST_CATEGORIES} selected={selectedInterests} onToggle={toggleInterest} maxSelected={MAX_INTERESTS} />
          {errors.interests && <p className="reg-error">{errors.interests}</p>}
        </div>
      );
    }

    if (currentStep === 7) {
      const isParentConsentError = completeError?.includes('parental') || completeError?.includes('PARENT_CONSENT_REQUIRED');
      return (
        <div className="complete-state">
          {completeState === 'loading' && (
            <>
              <Loader2 size={22} className="spin" />
              <h3>Setting up your account</h3>
              <p>Provisioning creator resources and final onboarding data.</p>
            </>
          )}
          {completeState === 'error' && isParentConsentError && (
            <div style={{ maxWidth: 480, margin: '0 auto', textAlign: 'left' }}>
              <div className="reg-banner reg-banner-error" style={{ marginBottom: 16 }}>
                <AlertCircle size={16} />
                <span>Parental/Guardian Consent Required</span>
              </div>
              <p style={{ fontSize: 13, color: '#9ca0ae', lineHeight: 1.6, marginBottom: 16 }}>
                Under the DPDP Act, users under 18 require verifiable parent/guardian approval to activate their account.
              </p>
              
              {parentRequestSent ? (
                <div style={{ background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.2)', borderRadius: 10, padding: 16, marginBottom: 16 }}>
                  <p style={{ color: '#22c55e', fontWeight: 600, margin: '0 0 8px' }}>Request Sent!</p>
                  <p style={{ margin: 0, fontSize: 12, color: '#9ca0ae', lineHeight: 1.5 }}>
                    We've emailed an approval link to <strong>{parentEmail}</strong>. Please ask your parent/guardian to check their inbox and approve your account.
                  </p>
                </div>
              ) : (
                <div className="auth-field" style={{ marginBottom: 16 }}>
                  <label className="auth-label">Parent / Guardian Email</label>
                  <div className="auth-input-wrap">
                    <span className="auth-prompt">&gt;</span>
                    <input
                      className="auth-input"
                      type="email"
                      value={parentEmail}
                      onChange={(e) => setParentEmail(e.target.value)}
                      placeholder="parent@domain.com"
                    />
                  </div>
                  {parentRequestError && <p className="reg-error">{parentRequestError}</p>}
                  <button
                    type="button"
                    className="auth-btn-primary"
                    disabled={parentRequestLoading}
                    onClick={async () => {
                      setParentRequestLoading(true);
                      setParentRequestError('');
                      try {
                        await api.post('/auth/register/parental-consent', { parent_email: parentEmail });
                        setParentRequestSent(true);
                      } catch (err) {
                        setParentRequestError(getErrorMessage(err));
                      } finally {
                        setParentRequestLoading(false);
                      }
                    }}
                    style={{ marginTop: 12 }}
                  >
                    <span>{parentRequestLoading ? 'Sending Request...' : 'Send Approval Request'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
          {completeState === 'error' && !isParentConsentError && (
            <>
              <div className="reg-banner reg-banner-error" style={{ marginBottom: 16 }}>
                <AlertCircle size={16} />
                <span>{completeError || 'Failed to complete registration setup.'}</span>
              </div>
              <button
                type="button"
                className="auth-btn-primary"
                onClick={() => setCompleteAttempt((v) => v + 1)}
              >
                <span>Retry Setup</span>
              </button>
            </>
          )}
        </div>
      );
    }
  };

  return (
    <>
      <style>{`
        .register-shell{position:relative;isolation:isolate;overflow:hidden;}
        .register-shell::before{content:'';position:fixed;inset:0;background:radial-gradient(circle at 20% 20%,rgba(122,0,255,.20),transparent 30%),radial-gradient(circle at 80% 10%,rgba(232,160,32,.10),transparent 26%),linear-gradient(120deg,#050507,#0b0b0f,#111218,#0b0b0f);background-size:100% 100%,100% 100%,400% 400%;animation:regGradient 24s ease-in-out infinite;pointer-events:none;z-index:-1;}
        .register-shell::after{content:'';position:fixed;inset:0;background-image:linear-gradient(rgba(255,255,255,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px);background-size:42px 42px;opacity:.16;pointer-events:none;z-index:-1;mask-image:linear-gradient(to bottom,rgba(0,0,0,.7),transparent 92%);}
        .register-shell.auth-root{position:relative;z-index:1;}
        .reg-stepper{display:flex;flex-direction:column;align-items:center;gap:10px;margin-bottom:20px;}
        .reg-stepper-track{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;}
        .reg-stepper-edge{display:flex;align-items:center;justify-content:center;color:var(--text-dimmer);flex-shrink:0;}
        .reg-stepper-count{font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--text-dim);}
        .reg-step{display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;color:var(--text-dim);font-size:10px;letter-spacing:.08em;text-transform:uppercase;flex:1;min-width:0;max-width:110px;transition:opacity .2s,transform .2s;}
        .reg-step-prev,.reg-step-next{opacity:.45;transform:scale(.92);}
        .reg-step-active{opacity:1;}
        .reg-step .reg-step-label{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;}
        .reg-step-icon{width:26px;height:26px;border-radius:999px;border:1px solid rgba(110,0,255,.25);display:grid;place-items:center;background:rgba(255,255,255,.03);color:var(--text-dim);flex-shrink:0;}
        .reg-step.is-active .reg-step-icon{background:rgba(110,0,255,.16);color:var(--accent);border-color:rgba(110,0,255,.55);width:30px;height:30px;} .reg-step.is-complete .reg-step-icon{background:rgba(34,197,94,.10);color:#22c55e;border-color:rgba(34,197,94,.35);} .reg-grid,.profile-grid,.review-grid,.reg-stack{display:grid;gap:16px;}.reg-grid{grid-template-columns:repeat(2,minmax(0,1fr));}.profile-grid{grid-template-columns:minmax(0,1.2fr) minmax(260px,.8fr);align-items:start;}.review-grid{grid-template-columns:repeat(2,minmax(0,1fr));}.reg-banner{display:flex;align-items:center;gap:10px;padding:12px 14px;border:1px solid rgba(232,160,32,.20);background:rgba(232,160,32,.08);color:#f6d38e;border-radius:10px;font-size:12px;}.reg-banner a{color:var(--accent-link);text-decoration:none;margin-left:auto;}.reg-banner-error{border-color:rgba(239,68,68,.25);background:rgba(239,68,68,.10);color:#fca5a5;}.reg-error{margin:6px 0 0;color:#fca5a5;font-size:11px;line-height:1.4;}.reg-helper{margin:4px 0 0;font-size:11px;color:var(--text-muted);line-height:1.5;}.reg-status{display:flex;align-items:center;gap:6px;margin-top:6px;font-size:11px;color:var(--text-muted);}.reg-status.available{color:#22c55e;}.reg-status.taken,.reg-status.error,.reg-status.invalid{color:#fca5a5;}.reg-status.checking{color:#f6d38e;}.spin{animation:spin 1s linear infinite;}.auth-textarea{min-height:120px;width:100%;resize:vertical;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);color:var(--text);border-radius:12px;padding:14px 16px;font:inherit;outline:none;}.auth-textarea:focus{border-color:rgba(110,0,255,.5);box-shadow:0 0 0 3px rgba(110,0,255,.12);}.choice-grid,.subtype-grid{display:grid;gap:12px;grid-template-columns:repeat(2,minmax(0,1fr));}.choice-card,.choice-chip,.toggle-pill,.link-btn{border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.03);color:var(--text);border-radius:14px;padding:14px 16px;cursor:pointer;transition:border-color .2s,background .2s,transform .15s;}.choice-card{text-align:left;display:flex;flex-direction:column;gap:6px;min-height:92px;}.choice-card.is-selected,.choice-chip.is-selected,.toggle-pill.on,.interest-chip.is-selected{border-color:rgba(110,0,255,.50);background:rgba(110,0,255,.14);}.choice-card small{color:var(--text-muted);font-size:11px;line-height:1.4;}.privacy-row,.profile-block-head,.review-head{display:flex;align-items:center;justify-content:space-between;gap:12px;}.profile-form{display:grid;gap:16px;}.profile-block{border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.02);border-radius:16px;padding:16px;}.profile-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;}.link-btn{padding:9px 12px;font-size:11px;display:inline-flex;align-items:center;gap:8px;}.preview-card,.review-card{border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);border-radius:18px;overflow:hidden;}.preview-banner,.preview-banner-fallback{min-height:118px;background:linear-gradient(135deg,rgba(122,0,255,.25),rgba(232,160,32,.08));background-size:cover;background-position:center;}.preview-body{padding:16px;}.preview-avatar-row{display:flex;gap:12px;align-items:flex-start;}.preview-avatar{width:54px;height:54px;border-radius:16px;overflow:hidden;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.10);display:grid;place-items:center;flex-shrink:0;}.preview-avatar img{width:100%;height:100%;object-fit:cover;}.preview-avatar span{font-weight:800;color:var(--accent-link);}.preview-name-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;}.preview-name-row strong{font-size:15px;}.preview-badge{font-size:9px;letter-spacing:.12em;text-transform:uppercase;padding:3px 6px;border-radius:999px;background:rgba(255,255,255,.06);}.preview-badge.professional{background:rgba(110,0,255,.16);color:#d8b4fe;}.preview-subtitle,.preview-bio,.preview-stats{color:var(--text-muted);font-size:12px;line-height:1.6;}.preview-bio{margin:14px 0;}.preview-stats{display:flex;flex-wrap:wrap;gap:10px;}.preview-stats span{display:inline-flex;align-items:center;gap:6px;}.interest-picker{display:grid;gap:18px;}.interest-category h4{margin:0 0 10px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--text-label);}.interest-grid{display:flex;flex-wrap:wrap;gap:10px;}.interest-chip{padding:10px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.03);color:var(--text);cursor:pointer;font-size:12px;}.interest-chip.is-disabled{opacity:.45;cursor:not-allowed;}.reg-counter{display:flex;justify-content:space-between;gap:12px;font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.08em;}.review-card{padding:16px;}.review-head h3{margin:6px 0 0;font-size:24px;line-height:1.1;}.review-pct{font-size:28px;font-weight:700;color:var(--accent-link);}.review-progress{height:10px;border-radius:999px;background:rgba(255,255,255,.06);overflow:hidden;margin:14px 0 18px;}.review-progress>div{height:100%;border-radius:inherit;background:linear-gradient(90deg,#7A00FF,#E8A020);}.review-list{display:grid;gap:10px;margin-top:14px;}.review-item{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text-muted);}.review-item.done{color:var(--text);}.review-dot{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.22);}.complete-state{min-height:280px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;text-align:center;color:var(--text);}.complete-state p{color:var(--text-muted);margin:0;}@keyframes regGradient{0%,100%{background-position:0% 50%;}50%{background-position:100% 50%;}}@keyframes spin{to{transform:rotate(360deg);}}@media (prefers-reduced-motion: reduce){.register-shell::before,.spin{animation:none;}}@media (max-width:960px){.reg-grid,.profile-grid,.review-grid,.choice-grid,.subtype-grid{grid-template-columns:1fr;}}@media (max-width:640px){.reg-step{max-width:84px;font-size:9px;}.reg-stepper-track{gap:6px;}.auth-body{padding:24px 18px 20px;}.auth-page-footer{padding:16px 20px;}}
      `}</style>
      <AuthTerminalLayout
        title="Register"
        processName="REGISTRATION_FLOW.EXE"
        pid="7017.SYS"
        classNameName="Registration"
        description={stepTitle}
        logs={[
          { time: '00:00:01', text: 'SESSION_SYNC_READY' },
          { time: '00:00:02', text: currentStep < 7 ? `ONBOARDING_STEP_${currentStep}` : 'FINALIZING_RESOURCE_GENERATION', dim: currentStep < 7 },
          { time: '00:00:03', text: loadingStatus ? 'HYDRATING_IN_PROGRESS_SESSION' : 'SESSION_RESUMED', isCursor: true },
        ]}
        onSubmit={handleSubmit}
        pageClassName="register-shell"
        panelMaxWidth={840}
        background={<VantaNetBackground color={0xd13fff} maxDistance={31} />}
      >
        {loadingStatus ? (
          <div className="complete-state"><Loader2 size={22} className="spin" /><h3>Synchronizing your signup session…</h3><p>Restoring your registration progress from the server.</p></div>
        ) : (
          <>
            <StepProgressBar currentStep={currentStep} />
            {renderStep()}
            {currentStep !== 7 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
                <Link to={`/login${location.search}`} className="auth-bypass">[ABORT_SESSION]</Link>
                {currentStep !== 2 ? (
                  <button type="submit" className="auth-btn-primary" disabled={busy || uploadState.avatar === 'uploading' || uploadState.banner === 'uploading'}>
                    <span>{busy ? 'PROCESSING…' : 'CONTINUE'}</span>
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  summary?.email_verified && (
                    <button type="button" onClick={() => setCurrentStep(3)} className="auth-btn-primary">
                      <span>CONTINUE</span>
                      <ArrowRight size={16} />
                    </button>
                  )
                )}
              </div>
            )}
          </>
        )}
      </AuthTerminalLayout>
    </>
  );
}
