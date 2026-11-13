import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Globe,
  HelpCircle,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  PartyPopper,
  RefreshCw,
  RotateCcw,
  Shield,
  ShieldAlert,
  Sparkles,
  Upload,
  User,
  Users,
  X,
} from 'lucide-react';
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
import { getRedirectTarget, getStoredRedirect, clearStoredRedirect } from '../../utils/navigation';

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
  const location = useLocation();
  const isSimulationApp = 
    searchParams.get('app') === 'simulation' || 
    searchParams.get('app') === 'simulation_arena' || 
    searchParams.get('client_id') === 'simulation_arena' ||
    (searchParams.get('redirect') && /simulation|3000/i.test(searchParams.get('redirect'))) ||
    (searchParams.get('next') && /simulation|3000/i.test(searchParams.get('next')));
  const { refreshUser } = useAuth();
  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  const otpInputRefs = useRef([]);
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

  // Password Visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 2 OTP state (6 distinct boxes)
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendBusy, setResendBusy] = useState(false);
  const [resendNotice, setResendNotice] = useState('');

  const selectedInterestCount = selectedInterests.size;
  const activeEmail = draft.email || summary?.email || '';

  const selectedInterestObjects = useMemo(() => {
    const map = new Map();
    for (const category of INTEREST_CATEGORIES) {
      for (const item of category.items) map.set(item.slug, { ...item, category: category.category });
    }
    return normalizeSlugList([...selectedInterests]).map((slug) => map.get(slug) || { slug, label: slug });
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

  // Resend cooldown timer countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Session persistence and resume on mount
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await api.get('/auth/register/status');
        if (!active) return;
        const data = res.data || {};
        if (data.completed) {
          const target = getRedirectTarget(window.location.search) || getStoredRedirect() || '/feed';
          clearStoredRedirect();
          if (target.startsWith('http://') || target.startsWith('https://')) {
            try {
              const token = localStorage.getItem('cpa_access_token');
              const targetUrl = new URL(target);
              if (token) {
                targetUrl.searchParams.set('token', token);
                targetUrl.searchParams.set('cpa_access_token', token);
                const cachedUser = localStorage.getItem('cpa_user');
                if (cachedUser) {
                  targetUrl.searchParams.set('user', encodeURIComponent(cachedUser));
                }
              }
              window.location.href = targetUrl.toString();
            } catch {
              window.location.href = target;
            }
          } else {
            navigate(target, { replace: true });
          }
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

  // Username availability check (Step 3) - debounced live check
  useEffect(() => {
    if (currentStep !== 3) return undefined;
    const username = draft.username.trim().toLowerCase().replace(/^@/, '');
    if (!username) {
      setUsernameState({ status: 'idle', message: '' });
      return undefined;
    }
    if (!USERNAME_REGEX.test(username)) {
      setUsernameState({ status: 'invalid', message: 'Use 3-30 lowercase letters, numbers, or underscores.' });
      return undefined;
    }

    let cancelled = false;
    setUsernameState({ status: 'checking', message: 'Checking handle availability…' });
    const timer = setTimeout(async () => {
      try {
        const res = await api.get('/auth/register/username-available', { params: { username } });
        if (cancelled) return;
        setUsernameState(
          res.data?.available
            ? { status: 'available', message: `@${username} is available` }
            : { status: 'taken', message: `@${username} is already taken` }
        );
      } catch (error) {
        if (!cancelled) setUsernameState({ status: 'error', message: getErrorMessage(error) });
      }
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [currentStep, draft.username]);

  // Final Step 7 completion
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
      } catch (error) {
        if (!cancelled) {
          setCompleteState('error');
          setCompleteError(getErrorMessage(error));
        }
      }
    };
    finalize();
    return () => { cancelled = true; };
  }, [currentStep, completeAttempt, refreshUser]);

  const handleFinishAndNavigate = () => {
    const target = getRedirectTarget(window.location.search) || getStoredRedirect() || '/feed';
    clearStoredRedirect();
    if (target.startsWith('http://') || target.startsWith('https://')) {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('cpa_access_token') : null;
        const targetUrl = new URL(target);
        if (token) {
          targetUrl.searchParams.set('token', token);
          targetUrl.searchParams.set('cpa_access_token', token);
          const cachedUser = localStorage.getItem('cpa_user');
          if (cachedUser) {
            targetUrl.searchParams.set('user', encodeURIComponent(cachedUser));
          }
        }
        window.location.href = targetUrl.toString();
      } catch {
        window.location.href = target;
      }
    } else {
      navigate(target, { replace: true });
    }
  };

  const refreshStatus = useCallback(async () => {
    try {
      const res = await api.get('/auth/register/status');
      const data = res.data || {};
      if (data.in_progress) {
        hydrateFromSummary(data.summary);
        if (data.summary?.email_verified && currentStep === 2) {
          setOtpSuccess('Email verified! Moving to identity setup...');
          setTimeout(() => setCurrentStep(3), 700);
        }
        return data.summary;
      }
    } catch (err) {
      console.error('Failed to refresh registration status:', err);
    }
    return null;
  }, [currentStep]);

  // Re-check status on window focus
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

  // OTP Box inputs handler
  const handleOtpDigitChange = (index, value) => {
    const cleanVal = value.replace(/\D/g, '');
    const nextDigits = [...otpDigits];

    if (cleanVal.length > 1) {
      // User pasted multiple digits into one box
      const pasted = cleanVal.slice(0, 6).split('');
      pasted.forEach((char, i) => {
        if (i < 6) nextDigits[i] = char;
      });
      setOtpDigits(nextDigits);
      setOtpError('');
      const fullCode = nextDigits.join('');
      if (fullCode.length === 6) {
        handleVerifyOtp(fullCode);
      }
      const nextFocus = Math.min(pasted.length, 5);
      otpInputRefs.current[nextFocus]?.focus();
      return;
    }

    nextDigits[index] = cleanVal;
    setOtpDigits(nextDigits);
    setOtpError('');

    if (cleanVal && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    const fullCode = nextDigits.join('');
    if (fullCode.length === 6) {
      handleVerifyOtp(fullCode);
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasteData) return;
    const nextDigits = [...otpDigits];
    pasteData.split('').forEach((char, i) => {
      if (i < 6) nextDigits[i] = char;
    });
    setOtpDigits(nextDigits);
    setOtpError('');
    if (pasteData.length === 6) {
      handleVerifyOtp(pasteData);
    }
    otpInputRefs.current[Math.min(pasteData.length, 5)]?.focus();
  };

  const handleVerifyOtp = async (codeOverride) => {
    const code = (codeOverride || otpDigits.join('')).trim();
    if (!code || code.length !== 6) {
      setOtpError('Please enter all 6 digits of your verification code.');
      return;
    }
    setOtpBusy(true);
    setOtpError('');
    setOtpSuccess('');

    try {
      const targetEmail = draft.email || summary?.email;
      const res = await api.post('/auth/verify-email-otp', { email: targetEmail, otp: code });
      if (res.data?.verified) {
        setOtpSuccess('Email verified successfully! Moving to identity step...');
        await refreshUser();
        await refreshStatus();
        setTimeout(() => {
          setCurrentStep(3);
        }, 600);
      }
    } catch (err) {
      setOtpError(getErrorMessage(err) || 'Invalid or expired code. Please request a new one.');
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
      setResendNotice('A new 6-digit verification code has been sent to your email.');
      setResendCooldown(45);
    } catch (err) {
      setOtpError('Failed to resend code. Please try again.');
    } finally {
      setResendBusy(false);
    }
  };

  // Navigation: Go to previous step
  const handlePrevStep = () => {
    if (busy || currentStep <= 1 || currentStep === 7) return;
    resetErrors();
    setCurrentStep((prev) => prev - 1);
  };

  // Step Validations
  const validateStep1 = () => {
    const next = {};
    if (!EMAIL_REGEX.test(draft.email.trim())) next.email = 'Enter a valid email address.';
    if (!PASSWORD_REGEX.test(draft.password)) {
      next.password = 'Password must be 8+ characters with uppercase, lowercase, number, and special character.';
    }
    if (draft.password !== draft.confirmPassword) {
      next.confirmPassword = 'Passwords do not match.';
    }
    if (!draft.date_of_birth) {
      next.date_of_birth = 'Date of birth is required.';
    }
    if (!draft.terms_privacy_consent) {
      next.terms_privacy_consent = 'You must agree to the Terms of Service and Privacy Policy.';
    }
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
    if (draft.account_type === 'professional' && !PROFESSIONAL_TYPES.includes(draft.professional_subtype)) {
      next.professional_subtype = 'Choose creator or business.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateStep5 = () => {
    if (uploadState.avatar === 'uploading' || uploadState.banner === 'uploading') {
      setErrors({ profile: 'Please wait for your images to finish uploading.' });
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
    if (selectedInterestCount < MIN_INTERESTS) {
      next.interests = `Select at least ${MIN_INTERESTS} interests to continue (${selectedInterestCount}/${MIN_INTERESTS}).`;
    }
    if (selectedInterestCount > MAX_INTERESTS) {
      next.interests = `Select no more than ${MAX_INTERESTS} interests (${selectedInterestCount}/${MAX_INTERESTS}).`;
    }
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
      setUploadError((prev) => ({ ...prev, [kind]: 'Only image files are supported (JPEG, PNG, WebP).' }));
      return;
    }
    const maxSize = kind === 'avatar' ? 5 : 10;
    if (file.size > maxSize * 1024 * 1024) {
      setUploadError((prev) => ({ ...prev, [kind]: `Image must be smaller than ${maxSize} MB.` }));
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
    3: "Let's set up your identity",
    4: 'How will you use FocusGram?',
    5: 'Make your profile yours',
    6: 'What are you interested in?',
    7: 'Setting up your account',
  }[currentStep] || 'Registration';

  const stepSubtitle = {
    1: 'Enter your personal details below to proceed.',
    2: `Enter the 6-digit code sent to ${activeEmail || 'your email'}.`,
    3: "Choose your public display name and unique @handle.",
    4: 'Select your account role and visibility settings.',
    5: 'Add a profile photo, cover banner, and bio so others know you.',
    6: 'Select 3 to 10 interests to personalize your developer feed.',
    7: 'Finalizing account provisioning and developer workspace.',
  }[currentStep] || '';

  const handleSubmit = async (event) => {
    if (event) event.preventDefault();
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
          terms_privacy_consent: draft.terms_privacy_consent,
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
    // ── STEP 1: Account Creation ──────────────────────────────────────────
    if (currentStep === 1) {
      const hasLength = draft.password.length >= 8;
      const hasUpper = /[A-Z]/.test(draft.password);
      const hasLower = /[a-z]/.test(draft.password);
      const hasNumber = /\d/.test(draft.password);
      const hasSpecial = /[^A-Za-z\d]/.test(draft.password);

      return (
        <div className="reg-stack">
          {/* Simulation Arena X FocusGram Co-Branded SSO Banner */}
          {isSimulationApp && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)',
              border: '1px solid rgba(6, 182, 212, 0.4)',
              borderRadius: '12px',
              padding: '12px 14px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 4px 16px rgba(6, 182, 212, 0.15)',
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '9px',
                background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(6, 182, 212, 0.35)',
              }}>
                ⚡
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#fff', letterSpacing: '0.02em' }}>
                    Simulation Arena
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: '900', color: '#06b6d4' }}>✕</span>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--green, #10b981)', letterSpacing: '0.02em' }}>
                    FocusGram
                  </span>
                </div>
                <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.3' }}>
                  Create your FocusGram account to unlock 3D STEM interactive virtual simulations.
                </p>
              </div>
            </div>
          )}

          {/* Email */}
          {/* Email Address */}
          <div className="auth-field">
            <label className="auth-label">Email address</label>
            <div className="auth-input-wrap">
              <Mail size={16} className="auth-field-icon" aria-hidden="true" />
              <input
                className="auth-input"
                type="email"
                value={draft.email}
                onChange={(e) => setField('email', e.target.value)}
                placeholder="developer@domain.com"
                autoComplete="email"
                required
              />
            </div>
            {errors.email && <p className="reg-error">{errors.email}</p>}
          </div>

          {/* Password */}
          <div className="auth-field">
            <label className="auth-label">Create password</label>
            <div className="auth-input-wrap">
              <Lock size={16} className="auth-field-icon" aria-hidden="true" />
              <input
                className="auth-input"
                type={showPassword ? 'text' : 'password'}
                value={draft.password}
                onChange={(e) => setField('password', e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="auth-eye-btn"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {/* Live Password Criteria Badges */}
            {draft.password && (
              <div className="password-criteria-row" aria-live="polite">
                <span className={`criteria-badge ${hasLength ? 'valid' : ''}`}>8+ chars</span>
                <span className={`criteria-badge ${hasUpper ? 'valid' : ''}`}>Uppercase</span>
                <span className={`criteria-badge ${hasLower ? 'valid' : ''}`}>Lowercase</span>
                <span className={`criteria-badge ${hasNumber ? 'valid' : ''}`}>Number</span>
                <span className={`criteria-badge ${hasSpecial ? 'valid' : ''}`}>Special char</span>
              </div>
            )}
            {errors.password && <p className="reg-error">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div className="auth-field">
            <label className="auth-label">Confirm password</label>
            <div className="auth-input-wrap">
              <KeyRound size={16} className="auth-field-icon" aria-hidden="true" />
              <input
                className="auth-input"
                type={showConfirmPassword ? 'text' : 'password'}
                value={draft.confirmPassword}
                onChange={(e) => setField('confirmPassword', e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="auth-eye-btn"
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && <p className="reg-error">{errors.confirmPassword}</p>}
          </div>

          {/* Date of Birth */}
          <div className="auth-field">
            <div className="auth-label-row">
              <label className="auth-label">Date of birth</label>
              <span className="auth-label-helper">Required for account verification</span>
            </div>
            <div className="auth-input-wrap">
              <Clock size={16} className="auth-field-icon" aria-hidden="true" />
              <input
                className="auth-input"
                type="date"
                value={draft.date_of_birth}
                onChange={(e) => setField('date_of_birth', e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            {errors.date_of_birth && <p className="reg-error">{errors.date_of_birth}</p>}
          </div>

          {/* Terms & Privacy Checkbox */}
          <div className="auth-field terms-consent-field">
            <label className="terms-consent-label">
              <input
                type="checkbox"
                className="terms-checkbox"
                checked={draft.terms_privacy_consent}
                onChange={(e) => setField('terms_privacy_consent', e.target.checked)}
              />
              <span>
                I agree to the{' '}
                <Link to="/terms" target="_blank" className="auth-inline-link">
                  Terms &amp; Conditions
                </Link>{' '}
                and{' '}
                <Link to="/privacy" target="_blank" className="auth-inline-link">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
            {errors.terms_privacy_consent && <p className="reg-error">{errors.terms_privacy_consent}</p>}
          </div>

          {notice && (
            <div className="reg-banner reg-banner-error" role="alert">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{notice}</span>
              {notice.includes('already exists') && (
                <Link to="/login" className="auth-link-shortcut">
                  Sign in
                </Link>
              )}
            </div>
          )}

          <div className="auth-alt-row">
            <span>Already have an account?</span>
            <Link to={`/login${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`} className="auth-inline-link">
              Sign in
            </Link>
          </div>
        </div>
      );
    }

    // ── STEP 2: Email Verification (OTP Boxes) ───────────────────────────
    if (currentStep === 2) {
      const isVerified = summary?.email_verified;

      return (
        <div className="reg-stack otp-screen-wrap">
          {/* Visual Header Shield/Mail Icon */}
          <div className="otp-header-badge">
            <div className="otp-badge-glow" aria-hidden="true">
              <Mail size={28} className="otp-mail-icon" />
              <Shield size={16} className="otp-shield-icon" />
            </div>
            <h3 className="otp-title">Verify your email address</h3>
            <p className="otp-subtitle">
              Enter the 6-digit verification code sent to{' '}
              <strong className="otp-email-highlight">{activeEmail}</strong>
            </p>
            <button
              type="button"
              className="otp-change-email-btn"
              onClick={() => setCurrentStep(1)}
            >
              Wrong email address? Change it
            </button>
          </div>

          {isVerified ? (
            <div className="otp-success-card" role="status">
              <CheckCircle2 size={36} className="otp-success-icon" />
              <h4>Email Verified!</h4>
              <p>Your email address is confirmed. Click continue below to set up your identity.</p>
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <a
                  href="focusgram://auth/verify?verified=true"
                  className="auth-btn-primary"
                  style={{ textDecoration: 'none', textAlign: 'center', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <span>Return to FocusGram App</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="otp-box-container">
              {/* 6 Individual Square OTP Cells */}
              <div className="otp-cells-row" onPaste={handleOtpPaste} aria-label="6-digit verification code">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className={`otp-digit-cell ${digit ? 'is-filled' : ''}`}
                    autoFocus={idx === 0}
                    aria-label={`Digit ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Countdown / Cooldown Timer */}
              <div className="otp-timer-pill" aria-live="polite">
                <Clock size={13} />
                <span>
                  {resendCooldown > 0
                    ? `Resend available in ${resendCooldown}s`
                    : 'Code valid for 10 minutes'}
                </span>
              </div>

              {otpError && (
                <div className="reg-banner reg-banner-error" role="alert">
                  <AlertCircle size={15} />
                  <span>{otpError}</span>
                </div>
              )}

              {otpSuccess && (
                <div className="reg-banner reg-banner-success" role="status">
                  <Check size={15} />
                  <span>{otpSuccess}</span>
                </div>
              )}

              {/* Verify Action Button */}
              <button
                type="button"
                onClick={() => handleVerifyOtp()}
                disabled={otpBusy || otpDigits.join('').length !== 6}
                className="auth-btn-primary otp-verify-btn"
              >
                {otpBusy ? <Loader2 size={16} className="spin" /> : <Check size={16} />}
                <span>{otpBusy ? 'Verifying code…' : 'Verify Email Address'}</span>
              </button>

              {/* Resend & Status Actions */}
              <div className="otp-action-footer">
                <div className="otp-resend-row">
                  <span>Didn&apos;t receive code?</span>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || resendBusy}
                    className="link-btn-text"
                  >
                    {resendBusy ? 'Sending…' : 'Resend code'}
                  </button>
                </div>

                <div className="otp-magiclink-check">
                  <span className="otp-meta-hint">Clicked the link in your email?</span>
                  <button
                    type="button"
                    onClick={refreshStatus}
                    className="otp-check-status-btn"
                  >
                    <RefreshCw size={12} />
                    <span>Check Status</span>
                  </button>
                </div>
              </div>

              {resendNotice && <p className="otp-resend-notice">{resendNotice}</p>}
            </div>
          )}
        </div>
      );
    }

    // ── STEP 3: Identity Confirmation ────────────────────────────────────
    if (currentStep === 3) {
      return (
        <div className="reg-stack">
          {/* Full Name */}
          <div className="auth-field">
            <div className="auth-label-row">
              <label className="auth-label">Full name</label>
              <span className="auth-label-helper">{draft.name.length}/80</span>
            </div>
            <div className="auth-input-wrap">
              <User size={16} className="auth-field-icon" aria-hidden="true" />
              <input
                className="auth-input"
                value={draft.name}
                onChange={(e) => setField('name', e.target.value.slice(0, 80))}
                placeholder="e.g. Alex Rivera"
                autoComplete="name"
                maxLength={80}
                required
              />
            </div>
            {errors.full_name && <p className="reg-error">{errors.full_name}</p>}
          </div>

          {/* Username with @ prefix */}
          <div className="auth-field">
            <div className="auth-label-row">
              <label className="auth-label">Username handle</label>
              <span className="auth-label-helper">3-30 letters, numbers, underscores</span>
            </div>
            <div className="auth-input-wrap">
              <span className="auth-handle-prefix">@</span>
              <input
                className="auth-input"
                value={draft.username}
                onChange={(e) =>
                  setField('username', e.target.value.replace(/^@/, '').toLowerCase().replace(/[^a-z0-9_]/g, ''))
                }
                placeholder="developer_handle"
                autoComplete="username"
                maxLength={30}
                required
              />
            </div>

            {/* Live Username Feedback Badge */}
            {draft.username && (
              <div className={`reg-status ${usernameState.status}`} aria-live="polite">
                {usernameState.status === 'checking' && <Loader2 size={13} className="spin" />}
                {usernameState.status === 'available' && <CheckCircle2 size={13} className="text-emerald" />}
                {usernameState.status === 'taken' && <X size={13} className="text-rose" />}
                {usernameState.status === 'invalid' && <AlertCircle size={13} className="text-rose" />}
                <span>{usernameState.message}</span>
              </div>
            )}
            {errors.username && <p className="reg-error">{errors.username}</p>}
          </div>

          <div className="identity-tip-card">
            <Sparkles size={16} className="identity-tip-icon" />
            <p>
              Your username is your permanent web handle across FocusGram feeds, posts, and developer profiles.
            </p>
          </div>
        </div>
      );
    }

    // ── STEP 4: Account Type and Visibility ──────────────────────────────
    if (currentStep === 4) {
      return (
        <div className="reg-stack">
          {/* Account Type Selection Cards */}
          <div className="choice-grid" role="radiogroup" aria-label="Select account type">
            <button
              type="button"
              role="radio"
              aria-checked={draft.account_type === 'personal'}
              className={`choice-card ${draft.account_type === 'personal' ? 'is-selected' : ''}`}
              onClick={() => {
                subtypeBackupRef.current = draft.professional_subtype;
                setDraft((prev) => ({
                  ...prev,
                  account_type: 'personal',
                  privacy_setting: privacyBackupRef.current,
                }));
                setErrors((prev) => ({ ...prev, account_type: '', professional_subtype: '' }));
              }}
            >
              <div className="choice-card-head">
                <div className="choice-icon-wrap">
                  <User size={20} />
                </div>
                <div className="choice-title-wrap">
                  <strong className="choice-title">Personal Account</strong>
                  <span className="choice-subtitle">For exploring, learning &amp; chatting</span>
                </div>
              </div>
              <p className="choice-desc">
                Follow developer communities, bookmark code snippets, and participate in technical discussions with public or private visibility.
              </p>
            </button>

            <button
              type="button"
              role="radio"
              aria-checked={draft.account_type === 'professional'}
              className={`choice-card ${draft.account_type === 'professional' ? 'is-selected' : ''}`}
              onClick={() => {
                privacyBackupRef.current = draft.privacy_setting;
                setDraft((prev) => ({
                  ...prev,
                  account_type: 'professional',
                  professional_subtype: prev.professional_subtype || subtypeBackupRef.current || 'creator',
                  privacy_setting: false,
                }));
                setErrors((prev) => ({ ...prev, account_type: '', professional_subtype: '' }));
              }}
            >
              <div className="choice-card-head">
                <div className="choice-icon-wrap">
                  <Sparkles size={20} />
                </div>
                <div className="choice-title-wrap">
                  <strong className="choice-title">Professional Account</strong>
                  <span className="choice-subtitle">For creators, authors &amp; teams</span>
                </div>
              </div>
              <p className="choice-desc">
                Publish technical tutorials, build a dedicated following, and access creator analytics. Public by default.
              </p>
            </button>
          </div>

          {/* Professional Subtype Selector */}
          {draft.account_type === 'professional' && (
            <div className="professional-subtype-section">
              <label className="auth-label">Professional Role</label>
              <div className="subtype-grid">
                {PROFESSIONAL_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`choice-chip ${draft.professional_subtype === type ? 'is-selected' : ''}`}
                    onClick={() => setDraft((prev) => ({ ...prev, professional_subtype: type }))}
                  >
                    <span className="capitalize">{type === 'creator' ? '🎨 Content Creator' : '🏢 Software Business'}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Privacy Setting Card & Toggle */}
          <div className="privacy-card">
            <div className="privacy-card-info">
              <div className="privacy-card-title-row">
                {draft.privacy_setting ? <Lock size={16} /> : <Globe size={16} />}
                <strong>{draft.privacy_setting ? 'Private Profile' : 'Public Profile'}</strong>
              </div>
              <p className="privacy-card-desc">
                {draft.privacy_setting
                  ? 'Only approved followers can view your feed and repositories.'
                  : 'Your profile and public repositories can be viewed by anyone on FocusGram.'}
              </p>
            </div>

            <button
              type="button"
              className={`toggle-switch-pill ${draft.privacy_setting ? 'on' : 'off'}`}
              onClick={() => setDraft((prev) => ({ ...prev, privacy_setting: !prev.privacy_setting }))}
              aria-label="Toggle profile privacy"
            >
              <span className="toggle-switch-thumb" />
            </button>
          </div>

          {draft.account_type === 'professional' && (
            <div className="reg-banner reg-banner-info">
              <ShieldAlert size={15} />
              <span>Professional accounts are recommended to stay public for maximum creator reach.</span>
            </div>
          )}

          {(errors.account_type || errors.professional_subtype) && (
            <p className="reg-error">{errors.account_type || errors.professional_subtype}</p>
          )}
        </div>
      );
    }

    // ── STEP 5: Profile Customization ────────────────────────────────────
    if (currentStep === 5) {
      return (
        <div className="profile-grid">
          <div className="profile-form">
            {/* Avatar Upload */}
            <div className="profile-block">
              <div className="profile-block-head">
                <div>
                  <label className="auth-label">Profile picture</label>
                  <p className="reg-helper">JPG, PNG or WebP up to 5 MB</p>
                </div>
                <div className="profile-actions">
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    <Upload size={14} /> Upload photo
                  </button>
                  <button
                    type="button"
                    className="link-btn link-btn-ghost"
                    onClick={() => handleSkipImage('avatar')}
                  >
                    Skip for now
                  </button>
                </div>
              </div>

              {/* Accessible hidden file input satisfying regression suite contracts */}
              <input
                ref={avatarInputRef}
                hidden
                type="file"
                accept="image/*"
                aria-label="Upload profile avatar"
                onChange={(e) => uploadImage('avatar', e.target.files?.[0])}
              />

              {uploadError.avatar && <p className="reg-error">{uploadError.avatar}</p>}
              {uploadState.avatar === 'uploading' && (
                <p className="reg-status checking">
                  <Loader2 size={12} className="spin" /> Uploading avatar…
                </p>
              )}
            </div>

            {/* Banner Cover Upload */}
            <div className="profile-block">
              <div className="profile-block-head">
                <div>
                  <label className="auth-label">Cover banner</label>
                  <p className="reg-helper">Wide 4:1 aspect ratio up to 10 MB</p>
                </div>
                <div className="profile-actions">
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() => bannerInputRef.current?.click()}
                  >
                    <Upload size={14} /> Upload cover
                  </button>
                  <button
                    type="button"
                    className="link-btn link-btn-ghost"
                    onClick={() => handleSkipImage('banner')}
                  >
                    Skip for now
                  </button>
                </div>
              </div>

              {/* Accessible hidden file input satisfying regression suite contracts */}
              <input
                ref={bannerInputRef}
                hidden
                type="file"
                accept="image/*"
                aria-label="Upload profile banner"
                onChange={(e) => uploadImage('banner', e.target.files?.[0])}
              />

              {uploadError.banner && <p className="reg-error">{uploadError.banner}</p>}
              {uploadState.banner === 'uploading' && (
                <p className="reg-status checking">
                  <Loader2 size={12} className="spin" /> Uploading banner…
                </p>
              )}
            </div>

            {/* Bio Textarea */}
            <div className="auth-field">
              <div className="auth-label-row">
                <label className="auth-label">Bio description</label>
                <span className="auth-label-helper">{draft.bio.length}/300</span>
              </div>
              <textarea
                className="auth-textarea"
                value={draft.bio}
                onChange={(e) => setField('bio', e.target.value.slice(0, 300))}
                placeholder="Tell developers what you are building, technologies you explore, or what drives you..."
                maxLength={300}
                rows={3}
              />
              {errors.bio && <p className="reg-error">{errors.bio}</p>}
            </div>

            {errors.profile && (
              <div className="reg-banner reg-banner-error">
                <AlertCircle size={16} />
                <span>{errors.profile}</span>
              </div>
            )}
          </div>

          {/* Live Profile Preview Card */}
          <ProfilePreviewCard user={{ ...draft, interests: selectedInterestObjects }} />
        </div>
      );
    }

    // ── STEP 6: Interest Selection ───────────────────────────────────────
    if (currentStep === 6) {
      const isValid = selectedInterestCount >= MIN_INTERESTS && selectedInterestCount <= MAX_INTERESTS;

      return (
        <div className="reg-stack">
          {/* Top Counter Status Pill */}
          <div className="interests-header-bar">
            <div className={`interests-counter-pill ${isValid ? 'is-valid' : 'is-pending'}`}>
              {isValid ? <Check size={14} strokeWidth={3} /> : <Sparkles size={14} />}
              <span>
                {selectedInterestCount < MIN_INTERESTS
                  ? `Select at least ${MIN_INTERESTS} interests (${selectedInterestCount}/${MIN_INTERESTS})`
                  : `${selectedInterestCount} of ${MAX_INTERESTS} maximum selected`}
              </span>
            </div>
            <span className="interests-helper-text">You can change these anytime in settings</span>
          </div>

          <InterestPicker
            categories={INTEREST_CATEGORIES}
            selected={selectedInterests}
            onToggle={toggleInterest}
            maxSelected={MAX_INTERESTS}
          />

          {errors.interests && <p className="reg-error">{errors.interests}</p>}
        </div>
      );
    }

    // ── STEP 7: Account Setup & Welcome ──────────────────────────────────
    if (currentStep === 7) {
      const isParentConsentError =
        completeError?.includes('parental') || completeError?.includes('PARENT_CONSENT_REQUIRED');

      return (
        <div className="complete-state">
          {completeState === 'loading' && (
            <div className="complete-loading-card">
              <Loader2 size={36} className="spin complete-spinner" />
              <h3>Getting your account ready</h3>
              <p>Provisioning your developer workspace, feed channels, and account security credentials...</p>
            </div>
          )}

          {completeState === 'success' && (
            <div className="complete-success-card" role="status">
              <div className="complete-confetti-badge">
                <PartyPopper size={36} className="complete-party-icon" />
                <CheckCircle2 size={24} className="complete-check-icon" />
              </div>
              <h3 className="complete-heading">Account created successfully!</h3>
              <p className="complete-subtext">
                Your FocusGram account is fully initialized. Welcome to our community of software developers and creators.
              </p>

              <button
                type="button"
                onClick={handleFinishAndNavigate}
                className="auth-btn-primary complete-action-btn"
              >
                <span>Proceed to Feed</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {completeState === 'error' && isParentConsentError && (
            <div className="parental-consent-card">
              <div className="reg-banner reg-banner-warning">
                <ShieldAlert size={18} />
                <strong>Parental / Guardian Consent Required</strong>
              </div>
              <p className="parental-consent-desc">
                Under data protection guidelines (DPDP Act), accounts created for users under 18 years of age require verified consent from a parent or guardian before activation.
              </p>

              {parentRequestSent ? (
                <div className="parental-sent-box">
                  <CheckCircle2 size={24} className="text-emerald" />
                  <div>
                    <strong>Approval Request Sent!</strong>
                    <p>
                      We have emailed an approval link to <strong>{parentEmail}</strong>. Please ask your parent/guardian to review and approve your account to finish setup.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="parental-form">
                  <div className="auth-field">
                    <label className="auth-label">Parent or Guardian Email Address</label>
                    <div className="auth-input-wrap">
                      <Mail size={16} className="auth-field-icon" aria-hidden="true" />
                      <input
                        className="auth-input"
                        type="email"
                        value={parentEmail}
                        onChange={(e) => setParentEmail(e.target.value)}
                        placeholder="parent@domain.com"
                        required
                      />
                    </div>
                    {parentRequestError && <p className="reg-error">{parentRequestError}</p>}
                  </div>

                  <button
                    type="button"
                    className="auth-btn-primary"
                    disabled={parentRequestLoading || !parentEmail.trim()}
                    onClick={async () => {
                      if (!EMAIL_REGEX.test(parentEmail.trim())) {
                        setParentRequestError('Enter a valid email address.');
                        return;
                      }
                      setParentRequestLoading(true);
                      setParentRequestError('');
                      try {
                        await api.post('/auth/register/parental-consent', { parent_email: parentEmail.trim() });
                        setParentRequestSent(true);
                      } catch (err) {
                        setParentRequestError(getErrorMessage(err));
                      } finally {
                        setParentRequestLoading(false);
                      }
                    }}
                  >
                    <span>{parentRequestLoading ? 'Sending approval request…' : 'Send Approval Request'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {completeState === 'error' && !isParentConsentError && (
            <div className="complete-error-card" role="alert">
              <div className="reg-banner reg-banner-error">
                <AlertCircle size={18} />
                <span>{completeError || 'Failed to complete registration setup.'}</span>
              </div>
              <p className="complete-error-helper">
                Something went wrong while finalizing your workspace. You can retry provisioning safely without losing your profile.
              </p>
              <button
                type="button"
                className="auth-btn-primary"
                onClick={() => setCompleteAttempt((v) => v + 1)}
              >
                <RotateCcw size={16} />
                <span>Retry Setup</span>
              </button>
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <>
      <style>{`
        /* ── Registration Layout & Shell ─────────────────────────────────── */
        .register-shell {
          position: relative;
          isolation: isolate;
          overflow-x: hidden;
        }
        .register-shell::before {
          content: '';
          position: fixed;
          inset: 0;
          background: radial-gradient(circle at 18% 18%, rgba(99, 102, 241, 0.18), transparent 32%),
                      radial-gradient(circle at 82% 14%, rgba(16, 185, 129, 0.10), transparent 28%),
                      linear-gradient(135deg, #0b0f19, #0f172a, #111827);
          background-size: 100% 100%;
          pointer-events: none;
          z-index: -1;
        }
        .register-shell::after {
          content: '';
          position: fixed;
          inset: 0;
          background-image: linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255, 255, 255, 0.018) 1px, transparent 1px);
          background-size: 40px 40px;
          opacity: 0.15;
          pointer-events: none;
          z-index: -1;
          mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.8), transparent 95%);
        }

        /* ── Stepper Navigation Bar ──────────────────────────────────────── */
        .reg-stepper {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 28px;
          width: 100%;
        }
        .reg-stepper-desktop-wrap {
          position: relative;
          width: 100%;
          padding: 6px 4px;
        }
        .reg-stepper-line-bg {
          position: absolute;
          top: 21px;
          left: 20px;
          right: 20px;
          height: 3px;
          background: var(--border-input, rgba(255, 255, 255, 0.08));
          border-radius: 999px;
          z-index: 0;
          overflow: hidden;
        }
        .reg-stepper-line-fill {
          height: 100%;
          background: linear-gradient(90deg, #6366f1, #10b981);
          transition: width 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .reg-stepper-track {
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          z-index: 1;
        }
        .reg-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          cursor: default;
          transition: all 0.2s ease;
        }
        .reg-step.is-clickable {
          cursor: pointer;
        }
        .reg-step-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid var(--border-input, rgba(255, 255, 255, 0.12));
          background: var(--bg-panel, #111827);
          color: var(--text-dim, #71717a);
          display: grid;
          place-items: center;
          font-weight: 700;
          font-size: 12px;
          transition: all 0.25s ease;
        }
        .reg-step.is-active .reg-step-icon {
          border-color: #6366f1;
          background: #6366f1;
          color: #ffffff;
          box-shadow: 0 0 16px rgba(99, 102, 241, 0.45);
          transform: scale(1.12);
        }
        .reg-step.is-complete .reg-step-icon {
          border-color: #10b981;
          background: rgba(16, 185, 129, 0.16);
          color: #10b981;
        }
        .reg-step-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-dim, #71717a);
          transition: color 0.2s ease;
        }
        .reg-step.is-active .reg-step-label {
          color: var(--text, #ffffff);
          font-weight: 700;
        }
        .reg-step.is-complete .reg-step-label {
          color: var(--text-muted, #a1a1aa);
        }
        .reg-stepper-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11px;
          letter-spacing: 0.04em;
          color: var(--text-muted, #94a3b8);
          padding-top: 4px;
        }
        .reg-stepper-count {
          font-family: var(--font-mono, 'JetBrains Mono', monospace);
          font-weight: 600;
          letter-spacing: 0.08em;
          color: #a78bfa;
        }

        /* ── Card & Input Form Elements ──────────────────────────────────── */
        .reg-stack {
          display: grid;
          gap: 18px;
        }
        .auth-field-icon {
          color: var(--text-dim, #71717a);
          flex-shrink: 0;
          margin-right: 6px;
        }
        .auth-handle-prefix {
          font-weight: 700;
          font-size: 16px;
          color: #6366f1;
          padding-right: 4px;
          user-select: none;
        }
        .auth-eye-btn {
          background: none;
          border: none;
          color: var(--text-dim, #71717a);
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s ease;
        }
        .auth-eye-btn:hover {
          color: #a78bfa;
        }
        .auth-label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }
        .auth-label-helper {
          font-size: 11px;
          color: var(--text-dim, #71717a);
        }
        .auth-inline-link {
          color: #a78bfa;
          text-decoration: underline;
          font-weight: 600;
          transition: color 0.2s ease;
        }
        .auth-inline-link:hover {
          color: #c4b5fd;
        }
        .password-criteria-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 8px;
        }
        .criteria-badge {
          font-size: 10px;
          padding: 2px 7px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.06);
          color: var(--text-dim, #71717a);
          transition: all 0.2s ease;
        }
        .criteria-badge.valid {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
          font-weight: 600;
        }
        .terms-consent-field {
          margin-top: 4px;
        }
        .terms-consent-label {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 12px;
          color: var(--text, #e2e8f0);
          line-height: 1.5;
          cursor: pointer;
        }
        .terms-checkbox {
          width: 17px;
          height: 17px;
          border-radius: 5px;
          accent-color: #6366f1;
          margin-top: 2px;
          cursor: pointer;
          flex-shrink: 0;
        }
        .auth-alt-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 13px;
          color: var(--text-muted, #94a3b8);
          margin-top: 6px;
        }

        /* ── STEP 2: Dedicated OTP Layout ────────────────────────────────── */
        .otp-screen-wrap {
          text-align: center;
          max-width: 520px;
          margin: 0 auto;
        }
        .otp-header-badge {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 20px;
        }
        .otp-badge-glow {
          width: 60px;
          height: 60px;
          border-radius: 18px;
          background: rgba(99, 102, 241, 0.15);
          border: 1px solid rgba(99, 102, 241, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          color: #818cf8;
          margin-bottom: 12px;
        }
        .otp-shield-icon {
          position: absolute;
          bottom: 6px;
          right: 6px;
          color: #10b981;
        }
        .otp-title {
          font-size: 22px;
          font-weight: 700;
          color: var(--text, #ffffff);
          margin: 0 0 6px;
        }
        .otp-subtitle {
          font-size: 13px;
          color: var(--text-muted, #94a3b8);
          line-height: 1.5;
          margin: 0;
        }
        .otp-email-highlight {
          color: var(--text, #ffffff);
          font-weight: 600;
        }
        .otp-change-email-btn {
          background: none;
          border: none;
          color: #a78bfa;
          font-size: 12px;
          cursor: pointer;
          margin-top: 6px;
          text-decoration: underline;
        }
        .otp-box-container {
          background: var(--bg-input, #111827);
          border: 1px solid var(--border, rgba(255, 255, 255, 0.08));
          border-radius: 18px;
          padding: 24px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        .otp-cells-row {
          display: flex;
          gap: 10px;
          justify-content: center;
          width: 100%;
        }
        .otp-digit-cell {
          width: 48px;
          height: 56px;
          border-radius: 12px;
          border: 1.5px solid var(--border-input, #374151);
          background: var(--bg-panel, #1a202c);
          color: var(--text, #ffffff);
          font-family: var(--font-mono, 'JetBrains Mono', monospace);
          font-size: 22px;
          font-weight: 700;
          text-align: center;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .otp-digit-cell:focus {
          border-color: #6366f1 !important;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25) !important;
        }
        .otp-digit-cell.is-filled {
          border-color: rgba(99, 102, 241, 0.45);
          background: rgba(99, 102, 241, 0.08);
        }
        .otp-timer-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.05);
          font-size: 11px;
          color: var(--text-muted, #94a3b8);
        }
        .otp-verify-btn {
          width: 100%;
          max-width: 320px;
          justify-content: center;
        }
        .otp-action-footer {
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
          border-top: 1px solid var(--border, rgba(255, 255, 255, 0.06));
          padding-top: 14px;
        }
        .otp-resend-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 12px;
          color: var(--text-muted, #94a3b8);
        }
        .otp-magiclink-check {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        .otp-meta-hint {
          font-size: 11px;
          color: var(--text-dim, #71717a);
        }
        .otp-check-status-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid var(--border-input, #374151);
          color: var(--text, #ffffff);
          border-radius: 8px;
          padding: 5px 10px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .otp-check-status-btn:hover {
          background: rgba(255, 255, 255, 0.12);
        }
        .otp-resend-notice {
          font-size: 11px;
          color: #10b981;
          margin: 0;
        }
        .otp-success-card {
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 16px;
          padding: 24px;
          text-align: center;
        }
        .otp-success-icon {
          color: #10b981;
          margin: 0 auto 10px;
        }

        /* ── STEP 3: Identity Tip ────────────────────────────────────────── */
        .identity-tip-card {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background: rgba(99, 102, 241, 0.08);
          border: 1px solid rgba(99, 102, 241, 0.25);
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 12px;
          color: #c7d2fe;
          line-height: 1.5;
        }
        .identity-tip-icon {
          color: #818cf8;
          flex-shrink: 0;
          margin-top: 2px;
        }

        /* ── STEP 4: Account Type & Privacy Cards ────────────────────────── */
        .choice-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }
        .choice-card {
          border: 1.5px solid var(--border-input, #374151);
          background: var(--bg-input, #111827);
          color: var(--text, #ffffff);
          border-radius: 16px;
          padding: 18px 16px;
          text-align: left;
          cursor: pointer;
          transition: all 0.22s ease;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .choice-card:hover {
          border-color: rgba(99, 102, 241, 0.5);
          box-shadow: 0 4px 16px rgba(99, 102, 241, 0.15);
        }
        .choice-card.is-selected {
          border-color: #6366f1 !important;
          background: rgba(99, 102, 241, 0.14) !important;
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.3), 0 8px 24px rgba(99, 102, 241, 0.2) !important;
        }
        .choice-card-head {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .choice-icon-wrap {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(99, 102, 241, 0.18);
          color: #818cf8;
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }
        .choice-title-wrap {
          display: flex;
          flex-direction: column;
        }
        .choice-title {
          font-size: 14px;
          font-weight: 700;
        }
        .choice-subtitle {
          font-size: 11px;
          color: var(--text-dim, #71717a);
        }
        .choice-desc {
          font-size: 11px;
          color: var(--text-muted, #94a3b8);
          line-height: 1.5;
          margin: 0;
        }
        .professional-subtype-section {
          background: var(--bg-input, #111827);
          border: 1px solid var(--border, rgba(255, 255, 255, 0.08));
          border-radius: 14px;
          padding: 14px 16px;
        }
        .subtype-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-top: 8px;
        }
        .choice-chip {
          padding: 10px 14px;
          border-radius: 10px;
          border: 1.5px solid var(--border-input, #374151);
          background: var(--bg-panel, #1f2937);
          color: var(--text, #ffffff);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .choice-chip.is-selected {
          border-color: #6366f1;
          background: #6366f1;
          color: #ffffff;
        }
        .privacy-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 14px 16px;
          border-radius: 14px;
          border: 1px solid var(--border, rgba(255, 255, 255, 0.08));
          background: var(--bg-input, #111827);
        }
        .privacy-card-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--text, #ffffff);
          margin-bottom: 2px;
        }
        .privacy-card-desc {
          font-size: 11px;
          color: var(--text-muted, #94a3b8);
          margin: 0;
          line-height: 1.4;
        }
        .toggle-switch-pill {
          width: 48px;
          height: 26px;
          border-radius: 999px;
          border: 1px solid var(--border-input, #374151);
          background: rgba(255, 255, 255, 0.1);
          cursor: pointer;
          position: relative;
          transition: background 0.25s, border-color 0.25s;
          flex-shrink: 0;
        }
        .toggle-switch-pill.on {
          background: #6366f1;
          border-color: #6366f1;
        }
        .toggle-switch-thumb {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #ffffff;
          transition: transform 0.25s;
        }
        .toggle-switch-pill.on .toggle-switch-thumb {
          transform: translateX(22px);
        }

        /* ── STEP 5: Profile Customization & Preview ─────────────────────── */
        .profile-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(280px, 0.85fr);
          gap: 20px;
          align-items: start;
        }
        .profile-form {
          display: grid;
          gap: 14px;
        }
        .profile-block {
          border: 1px solid var(--border, rgba(255, 255, 255, 0.08));
          background: var(--bg-input, #111827);
          border-radius: 16px;
          padding: 16px;
        }
        .profile-block-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .profile-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .link-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 1px solid var(--border-input, #374151);
          background: rgba(255, 255, 255, 0.06);
          color: var(--text, #ffffff);
          border-radius: 10px;
          padding: 7px 12px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .link-btn:hover {
          border-color: #6366f1;
          color: #a78bfa;
        }
        .link-btn-ghost {
          background: transparent;
          border-color: transparent;
          color: var(--text-dim, #71717a);
        }
        .link-btn-ghost:hover {
          color: var(--text, #ffffff);
        }
        .auth-textarea {
          width: 100%;
          border-radius: 12px;
          border: 1.5px solid var(--border-input, #374151);
          background: var(--bg-input, #111827);
          color: var(--text, #ffffff);
          padding: 12px 14px;
          font-family: inherit;
          font-size: 13px;
          line-height: 1.5;
          resize: vertical;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .auth-textarea:focus {
          border-color: #6366f1 !important;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25) !important;
        }

        /* ── ProfilePreviewCard Styles (Preserves Static Regression Tests) ── */
        .preview-card {
          border: 1px solid var(--border, rgba(255, 255, 255, 0.08));
          background: var(--bg-input, #111827);
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
        }
        .preview-card-header-bar {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: rgba(0, 0, 0, 0.2);
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }
        .preview-card-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .preview-card-dot-red { background: #ef4444; }
        .preview-card-dot-yellow { background: #f59e0b; }
        .preview-card-dot-green { background: #10b981; }
        .preview-card-title-text {
          font-size: 10px;
          font-family: var(--font-mono, monospace);
          color: var(--text-dim, #71717a);
          letter-spacing: 0.05em;
          margin-left: 6px;
        }
        .preview-banner,
        .preview-banner-fallback {
          width: 100%;
          aspect-ratio: 4 / 1;
          min-height: 70px;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.35), rgba(16, 185, 129, 0.2));
          background-size: cover;
          background-position: center;
        }
        .preview-body {
          padding: 16px;
        }
        .preview-avatar-row {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .preview-avatar {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          overflow: hidden;
          background: #1f2937;
          border: 2px solid #6366f1;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          color: #ffffff;
          font-weight: 700;
        }
        .preview-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .preview-avatar-initials {
          font-size: 18px;
          font-weight: 800;
          color: #a78bfa;
        }
        .preview-meta {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .preview-name-row {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .preview-display-name {
          font-size: 15px;
          font-weight: 700;
          color: var(--text, #ffffff);
        }
        .preview-verified-icon {
          color: #10b981;
        }
        .preview-badge {
          font-size: 9px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 2px 6px;
          border-radius: 999px;
          background: rgba(99, 102, 241, 0.2);
          color: #c7d2fe;
          font-weight: 600;
        }
        .preview-subtitle {
          font-size: 12px;
          color: var(--text-muted, #94a3b8);
        }
        .preview-bio {
          font-size: 12px;
          line-height: 1.5;
          color: var(--text, #e2e8f0);
          margin: 12px 0 10px;
        }
        .preview-interests-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 12px;
        }
        .preview-interest-tag {
          font-size: 10px;
          font-weight: 600;
          color: #818cf8;
          background: rgba(99, 102, 241, 0.12);
          padding: 2px 7px;
          border-radius: 999px;
        }
        .preview-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          font-size: 11px;
          color: var(--text-dim, #71717a);
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding-top: 10px;
        }
        .preview-stats span {
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        /* ── STEP 6: Interests Selection ─────────────────────────────────── */
        .interests-header-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
        }
        .interests-counter-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          transition: all 0.2s ease;
        }
        .interests-counter-pill.is-pending {
          background: rgba(245, 158, 11, 0.14);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }
        .interests-counter-pill.is-valid {
          background: rgba(16, 185, 129, 0.14);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .interests-helper-text {
          font-size: 11px;
          color: var(--text-dim, #71717a);
        }
        .interest-picker {
          display: grid;
          gap: 18px;
        }
        .interest-search-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--bg-input, #111827);
          border: 1px solid var(--border-input, #374151);
          border-radius: 12px;
          padding: 8px 12px;
        }
        .interest-search-icon {
          color: var(--text-dim, #71717a);
          flex-shrink: 0;
        }
        .interest-search-input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text, #ffffff);
          font-size: 13px;
          outline: none;
        }
        .interest-search-clear {
          background: none;
          border: none;
          color: var(--text-dim, #71717a);
          cursor: pointer;
          font-size: 12px;
        }
        .interest-empty-state {
          text-align: center;
          padding: 24px;
          color: var(--text-muted, #94a3b8);
          font-size: 13px;
        }
        .interest-cat-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        .interest-cat-bullet {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #6366f1;
        }
        .interest-cat-header h4 {
          margin: 0;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #a78bfa;
          font-weight: 700;
        }
        .interest-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .interest-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 999px;
          border: 1.5px solid var(--border-input, #374151);
          background: var(--bg-input, #111827);
          color: var(--text, #e2e8f0);
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .interest-chip:hover:not(.is-disabled) {
          border-color: rgba(99, 102, 241, 0.6);
          background: rgba(99, 102, 241, 0.1);
        }
        .interest-chip.is-selected {
          border-color: #6366f1 !important;
          background: #6366f1 !important;
          color: #ffffff !important;
          font-weight: 600;
          box-shadow: 0 2px 10px rgba(99, 102, 241, 0.35);
        }
        .interest-chip.is-disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
        .interest-chip-icon {
          font-size: 14px;
        }
        .interest-chip-check {
          color: #ffffff;
        }

        /* ── STEP 7: Final Completion & Parental Consent ─────────────────── */
        .complete-state {
          min-height: 280px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          width: 100%;
        }
        .complete-loading-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          max-width: 440px;
        }
        .complete-spinner {
          color: #6366f1;
        }
        .complete-success-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          max-width: 480px;
          padding: 24px;
          border-radius: 20px;
          background: var(--bg-input, #111827);
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .complete-confetti-badge {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: rgba(16, 185, 129, 0.15);
          border: 2px solid #10b981;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          margin-bottom: 6px;
        }
        .complete-party-icon {
          color: #10b981;
        }
        .complete-check-icon {
          position: absolute;
          bottom: -4px;
          right: -4px;
          background: #111827;
          border-radius: 50%;
          color: #10b981;
        }
        .complete-heading {
          font-size: 22px;
          font-weight: 800;
          color: var(--text, #ffffff);
          margin: 0;
        }
        .complete-subtext {
          font-size: 13px;
          color: var(--text-muted, #94a3b8);
          line-height: 1.5;
          margin: 0;
        }
        .complete-action-btn {
          width: 100%;
          max-width: 280px;
          margin-top: 8px;
          justify-content: center;
        }
        .parental-consent-card {
          width: 100%;
          max-width: 480px;
          text-align: left;
        }
        .parental-consent-desc {
          font-size: 13px;
          color: var(--text-muted, #94a3b8);
          line-height: 1.6;
          margin: 12px 0 16px;
        }
        .parental-sent-box {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.25);
          border-radius: 12px;
          padding: 16px;
          font-size: 12px;
          color: var(--text, #ffffff);
        }
        .parental-sent-box strong {
          color: #10b981;
          display: block;
          margin-bottom: 4px;
        }
        .parental-form {
          display: grid;
          gap: 14px;
        }
        .complete-error-card {
          max-width: 480px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .complete-error-helper {
          font-size: 12px;
          color: var(--text-muted, #94a3b8);
          margin: 0;
        }

        /* ── Common Banners & Statuses ───────────────────────────────────── */
        .reg-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 12px;
          font-size: 12px;
          line-height: 1.4;
        }
        .reg-banner-error {
          border: 1px solid rgba(239, 68, 68, 0.3);
          background: rgba(239, 68, 68, 0.1);
          color: #fca5a5;
        }
        .reg-banner-success {
          border: 1px solid rgba(16, 185, 129, 0.3);
          background: rgba(16, 185, 129, 0.1);
          color: #6ee7b7;
        }
        .reg-banner-warning {
          border: 1px solid rgba(245, 158, 11, 0.3);
          background: rgba(245, 158, 11, 0.1);
          color: #fde68a;
        }
        .reg-banner-info {
          border: 1px solid rgba(99, 102, 241, 0.3);
          background: rgba(99, 102, 241, 0.1);
          color: #c7d2fe;
        }
        .reg-error {
          margin: 5px 0 0;
          color: #fca5a5;
          font-size: 11px;
          line-height: 1.4;
        }
        .reg-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          margin-top: 4px;
        }
        .reg-status.available { color: #10b981; }
        .reg-status.taken, .reg-status.invalid, .reg-status.error { color: #fca5a5; }
        .reg-status.checking { color: #f59e0b; }
        .text-emerald { color: #10b981; }
        .text-rose { color: #ef4444; }
        .spin { animation: spin 1s linear infinite; }

        /* ── Navigation Bottom Bar ───────────────────────────────────────── */
        .reg-nav-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-top: 26px;
          padding-top: 18px;
          border-top: 1px solid var(--border, rgba(255, 255, 255, 0.08));
        }
        .auth-btn-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-input, #374151);
          color: var(--text, #ffffff);
          border-radius: 12px;
          padding: 12px 18px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .auth-btn-back:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
          border-color: #6366f1;
        }
        .auth-btn-back:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        @keyframes spin { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) {
          .register-shell::before, .spin { animation: none; }
        }

        /* ── Responsive Viewport Collapses ───────────────────────────────── */
        @media (max-width: 860px) {
          .profile-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .choice-grid { grid-template-columns: 1fr; }
          .subtype-grid { grid-template-columns: 1fr; }
          .otp-digit-cell {
            width: 40px;
            height: 48px;
            font-size: 18px;
          }
          .reg-step-label { display: none; }
          .reg-stepper-meta { font-size: 10px; }
        }
      `}</style>

      <AuthTerminalLayout
        title="Register"
        processName="REGISTRATION_FLOW.EXE"
        pid="7017.SYS"
        classNameName="Registration"
        description={stepTitle}
        logs={[
          { time: '00:00:01', text: 'SESSION_SYNC_READY' },
          {
            time: '00:00:02',
            text: currentStep < 7 ? `ONBOARDING_STEP_${currentStep}` : 'FINALIZING_WORKSPACE_RESOURCES',
            dim: currentStep < 7,
          },
          {
            time: '00:00:03',
            text: loadingStatus ? 'HYDRATING_IN_PROGRESS_SESSION' : 'SESSION_ACTIVE',
            isCursor: true,
          },
        ]}
        onSubmit={handleSubmit}
        pageClassName="register-shell"
        panelMaxWidth={currentStep === 5 ? 880 : 580}
        background={<VantaNetBackground color={0x6366f1} maxDistance={30} />}
      >
        {loadingStatus ? (
          <div className="complete-state">
            <Loader2 size={24} className="spin" />
            <h3 style={{ margin: '10px 0 4px', fontSize: 16 }}>Restoring your registration session…</h3>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
              Checking existing server progress and draft state.
            </p>
          </div>
        ) : (
          <>
            <StepProgressBar currentStep={currentStep} onStepClick={handlePrevStep} />

            {/* Stage Content */}
            {renderStep()}

            {/* Bottom Navigation Buttons (Steps 1 through 6) */}
            {currentStep !== 7 && (
              <div className="reg-nav-actions">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    disabled={busy || uploadState.avatar === 'uploading' || uploadState.banner === 'uploading'}
                    className="auth-btn-back"
                  >
                    <ArrowLeft size={16} />
                    <span>Back</span>
                  </button>
                ) : (
                  <Link to={`/login${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`} className="auth-bypass">
                    [RETURN_TO_LOGIN]
                  </Link>
                )}

                {currentStep !== 2 ? (
                  <button
                    type="submit"
                    className="auth-btn-primary"
                    disabled={
                      busy ||
                      uploadState.avatar === 'uploading' ||
                      uploadState.banner === 'uploading' ||
                      (currentStep === 6 && (selectedInterestCount < MIN_INTERESTS || selectedInterestCount > MAX_INTERESTS))
                    }
                  >
                    <span>{busy ? 'Processing…' : currentStep === 6 ? 'Complete Setup' : 'Continue'}</span>
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  summary?.email_verified && (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="auth-btn-primary"
                    >
                      <span>Continue to Identity</span>
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
