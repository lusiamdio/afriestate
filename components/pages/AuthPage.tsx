import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { GmailIcon, OutlookIcon } from '../icons/SocialIcons';
import {
  EyeIcon,
  EyeSlashIcon,
  CheckIcon,
  ArrowUpTrayIcon,
  CheckBadgeIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { BuildingStorefrontIcon, BuildingOffice2Icon, UserIcon } from '@heroicons/react/24/solid';
import { BanknotesIcon } from '../icons/ActionIcons';

export type AuthView =
  | 'login'
  | 'signup'
  | 'userSignup'
  | 'agentSignup'
  | 'investorSignup'
  | 'pendingVerificationAgent'
  | 'pendingVerificationInvestor'
  | 'forgotPassword'
  | 'resetConfirmation'
  | 'confirmEmail';

interface AuthPageProps {
  initialView?: AuthView;
  onBack: () => void;
  onLogin: () => void;
  onSwitchToPricing?: () => void;
  onSuperAdminLogin?: () => void;
  onSelectHotelManager?: () => void;
}

interface PasswordCriteria {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  special: boolean;
  all: boolean;
}

const isPasswordStrong = (password: string): PasswordCriteria => {
  const criteria = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*]/.test(password),
  };
  return { ...criteria, all: Object.values(criteria).every(Boolean) };
};

const AuthInput: React.FC<{
  label: string;
  id?: string;
  type?: string;
  value: string;
  name?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  icon?: React.ElementType;
  onIconClick?: () => void;
  disabled?: boolean;
  placeholder?: string;
  note?: string;
  required?: boolean;
  autoComplete?: string;
}> = ({
  label,
  id,
  type = 'text',
  value,
  name,
  onChange,
  icon: Icon,
  onIconClick,
  disabled,
  placeholder,
  note,
  required = true,
  autoComplete,
}) => (
  <div>
    <label htmlFor={id || name} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
      {label}
    </label>
    <div className="relative">
      {type === 'textarea' ? (
        <textarea
          id={id || name}
          name={name || id}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          required={required}
          rows={2}
          className="w-full px-4 py-3.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 border-0 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-800 dark:focus:ring-amber-400 transition-all"
        />
      ) : (
        <input
          id={id || name}
          name={name || id}
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          className="w-full px-4 py-3.5 pr-11 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 border-0 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-800 dark:focus:ring-amber-400 transition-all"
        />
      )}
      {Icon && (
        <button
          type="button"
          onClick={onIconClick}
          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          aria-label="Toggle visibility"
        >
          <Icon className="h-5 w-5" />
        </button>
      )}
    </div>
    {note && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{note}</p>}
  </div>
);

const FileUploadField: React.FC<{
  label: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  acceptedTypes: string;
  required?: boolean;
}> = ({ label, file, onFileChange, acceptedTypes, required = false }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>
    <label
      htmlFor={label}
      className="cursor-pointer bg-slate-100/90 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-800 rounded-xl font-medium text-emerald-800 dark:text-amber-300 transition-colors p-4 flex justify-center items-center gap-2.5"
    >
      <ArrowUpTrayIcon className="w-5 h-5" />
      <span className="text-sm">{file ? 'Replace document' : 'Upload verification document'}</span>
      <input
        id={label}
        name={label}
        type="file"
        className="sr-only"
        onChange={(e) => onFileChange(e.target.files ? e.target.files[0] : null)}
        accept={acceptedTypes}
        required={required}
      />
    </label>
    {file && <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1.5 truncate font-medium">Selected: {file.name}</p>}
  </div>
);

const PasswordStrengthMeter: React.FC<{ criteria: PasswordCriteria }> = ({ criteria }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1.5 text-xs pt-1">
    {[
      { label: '8+ characters', met: criteria.length },
      { label: '1 uppercase', met: criteria.uppercase },
      { label: '1 lowercase', met: criteria.lowercase },
      { label: '1 number', met: criteria.number },
      { label: '1 special (!@#$%^&*)', met: criteria.special },
    ].map((item) => (
      <div
        key={item.label}
        className={`flex items-center gap-1.5 transition-colors ${
          item.met ? 'text-emerald-700 dark:text-emerald-400 font-medium' : 'text-slate-400'
        }`}
      >
        <div
          className={`w-3.5 h-3.5 shrink-0 rounded-full flex items-center justify-center ${
            item.met ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700'
          }`}
        >
          {item.met && <CheckIcon className="w-2.5 h-2.5 stroke-2" />}
        </div>
        <span>{item.label}</span>
      </div>
    ))}
  </div>
);

const ProviderAuthButtons: React.FC<{
  mode: 'signin' | 'signup';
  roleHint?: 'user' | 'agent' | 'investor';
  setError: (e: string) => void;
  onMagicLinkSent: () => void;
}> = ({ mode, roleHint = 'user', setError, onMagicLinkSent }) => {
  const [busyProvider, setBusyProvider] = useState<'gmail' | 'outlook' | null>(null);
  const [fallbackProvider, setFallbackProvider] = useState<'gmail' | 'outlook' | null>(null);
  const [providerEmail, setProviderEmail] = useState('');
  const [sendingLink, setSendingLink] = useState(false);

  const actionPrefix = mode === 'signin' ? 'Continue with' : 'Sign up with';

  const handleProviderOAuth = async (target: 'gmail' | 'outlook') => {
    setError('');
    setBusyProvider(target);
    try {
      const provider = target === 'gmail' ? 'google' : 'azure';
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
          ...(target === 'gmail'
            ? { queryParams: { access_type: 'offline', prompt: 'select_account' } }
            : { scopes: 'email openid profile' }),
        },
      });
      if (error) {
        setFallbackProvider(target);
        setError(
          target === 'outlook'
            ? 'Direct Outlook redirect requires Azure OAuth setup; enter your Outlook / Hotmail / Live email below for instant one-click link authentication.'
            : 'Direct Gmail redirect is unavailable in this preview; enter your Gmail address below for instant one-click link authentication.'
        );
      }
    } catch {
      setFallbackProvider(target);
      setError(
        `Use your ${target === 'gmail' ? 'Gmail' : 'Outlook'} email below to receive an instant verification link.`
      );
    } finally {
      setBusyProvider(null);
    }
  };

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = providerEmail.trim().toLowerCase();
    if (!cleaned || !cleaned.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (fallbackProvider === 'gmail' && !cleaned.endsWith('@gmail.com') && !cleaned.endsWith('@googlemail.com')) {
      setError('Please enter a valid Gmail account address (@gmail.com).');
      return;
    }
    if (
      fallbackProvider === 'outlook' &&
      !cleaned.endsWith('@outlook.com') &&
      !cleaned.endsWith('@hotmail.com') &&
      !cleaned.endsWith('@live.com') &&
      !cleaned.endsWith('@msn.com')
    ) {
      setError('Please enter a valid Outlook / Microsoft email (@outlook.com, @hotmail.com, @live.com).');
      return;
    }

    setError('');
    setSendingLink(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: cleaned,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            role: roleHint,
            auth_provider: fallbackProvider,
          },
        },
      });
      if (error) throw error;
      onMagicLinkSent();
    } catch (err: any) {
      setError(err.message || 'Unable to send authentication link. Please try again.');
    } finally {
      setSendingLink(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          disabled={busyProvider !== null}
          onClick={() => handleProviderOAuth('gmail')}
          className="flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-60"
        >
          <GmailIcon className="w-5 h-5 shrink-0" />
          <span className="whitespace-nowrap">
            {busyProvider === 'gmail' ? 'Connecting...' : `${actionPrefix} Gmail`}
          </span>
        </button>

        <button
          type="button"
          disabled={busyProvider !== null}
          onClick={() => handleProviderOAuth('outlook')}
          className="flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-60"
        >
          <OutlookIcon className="w-5 h-5 shrink-0" />
          <span className="whitespace-nowrap">
            {busyProvider === 'outlook' ? 'Connecting...' : `${actionPrefix} Outlook`}
          </span>
        </button>
      </div>

      {fallbackProvider && (
        <form
          onSubmit={handleMagicLinkSubmit}
          className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/90 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              {fallbackProvider === 'gmail' ? (
                <GmailIcon className="w-4 h-4" />
              ) : (
                <OutlookIcon className="w-4 h-4" />
              )}
              {fallbackProvider === 'gmail' ? 'Gmail Instant Access Link' : 'Outlook Instant Access Link'}
            </span>
            <button
              type="button"
              onClick={() => {
                setFallbackProvider(null);
                setError('');
              }}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Cancel
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              value={providerEmail}
              onChange={(e) => setProviderEmail(e.target.value)}
              placeholder={
                fallbackProvider === 'gmail' ? 'your.name@gmail.com' : 'your.name@outlook.com'
              }
              required
              className="flex-1 px-3.5 py-2.5 rounded-lg bg-white dark:bg-slate-900 border-0 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-700 outline-none"
            />
            <button
              type="submit"
              disabled={sendingLink}
              className="px-4 py-2.5 rounded-lg bg-[#0B1F1A] hover:bg-emerald-900 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 disabled:opacity-60"
            >
              {sendingLink ? 'Sending...' : 'Send Sign-In Link'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

const AuthPage: React.FC<AuthPageProps> = ({
  initialView = 'login',
  onBack,
  onLogin,
  onSwitchToPricing,
  onSuperAdminLogin,
  onSelectHotelManager,
}) => {
  const [view, setView] = useState<AuthView>(initialView);
  const [error, setError] = useState('');

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // User signup state
  const [userForm, setUserForm] = useState({
    fullName: '',
    email: '',
    password: '',
    agreeToTerms: false,
  });
  const [showUserPassword, setShowUserPassword] = useState(false);

  // Agent signup state
  const [agentForm, setAgentForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    officeAddress: '',
    businessRegNumber: '',
    agentLicense: '',
    agreeToTerms: false,
  });
  const [showAgentPassword, setShowAgentPassword] = useState(false);
  const [agentIdDoc, setAgentIdDoc] = useState<File | null>(null);

  // Investor signup state
  const [investorStep, setInvestorStep] = useState(1);
  const [investorForm, setInvestorForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    investmentType: 'Individual',
    companyName: '',
    agreeToTerms: false,
  });
  const [showInvestorPassword, setShowInvestorPassword] = useState(false);
  const [investorIdDoc, setInvestorIdDoc] = useState<File | null>(null);

  // Forgot password state
  const [resetEmail, setResetEmail] = useState('');

  useEffect(() => {
    setView(initialView);
    setError('');
  }, [initialView]);

  const switchView = (next: AuthView) => {
    setError('');
    setView(next);
  };

  const isSignUpMode = ['signup', 'userSignup', 'agentSignup', 'investorSignup'].includes(view);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (loginEmail === 'simao@neurogrowthlabs.co.za' && loginPassword === 'AfriEstate2@') {
      if (onSuperAdminLogin) onSuperAdminLogin();
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      if (error) throw error;
      onLogin();
    } catch (err: any) {
      if (err.message === 'Email not confirmed') {
        setError('Please verify your email address. Check your inbox for the confirmation link.');
      } else if (err.message === 'Invalid login credentials') {
        setError('Invalid email or password. Please try again.');
      } else {
        setError(err.message || 'Failed to sign in.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleUserSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!isPasswordStrong(userForm.password).all) {
      setError('Password does not meet security requirements.');
      return;
    }
    if (!userForm.agreeToTerms) {
      setError('You must agree to the Terms & Conditions.');
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userForm.email,
        password: userForm.password,
        options: {
          data: {
            full_name: userForm.fullName,
            role: 'user',
          },
        },
      });
      if (error) throw error;
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        setError('This email is already in use. Please sign in instead.');
        return;
      }
      if (!data.session) {
        switchView('confirmEmail');
      } else {
        onLogin();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAgentSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!isPasswordStrong(agentForm.password).all) {
      setError('Password does not meet security requirements.');
      return;
    }
    if (!agentIdDoc) {
      setError('Please upload your ID or Business Certificate for verification.');
      return;
    }
    if (!agentForm.agreeToTerms) {
      setError('You must agree to the Agent Terms & Conditions.');
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: agentForm.email,
        password: agentForm.password,
        options: {
          data: {
            full_name: agentForm.fullName,
            role: 'agent',
            phone: agentForm.phone,
            officeAddress: agentForm.officeAddress,
            businessRegNumber: agentForm.businessRegNumber,
            agentLicense: agentForm.agentLicense,
          },
        },
      });
      if (error) throw error;
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        setError('This email is already in use. Please sign in instead.');
        return;
      }
      switchView('pendingVerificationAgent');
    } catch (err: any) {
      setError(err.message || 'Failed to register agency.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInvestorNext = () => {
    if (investorStep === 1 && !isPasswordStrong(investorForm.password).all) {
      setError('Password does not meet security requirements.');
      return;
    }
    setError('');
    setInvestorStep((s) => s + 1);
  };

  const handleInvestorSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!investorIdDoc) {
      setError('Please upload your Proof of Identity.');
      return;
    }
    if (!investorForm.agreeToTerms) {
      setError('You must agree to the Investor Terms & Conditions.');
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: investorForm.email,
        password: investorForm.password,
        options: {
          data: {
            full_name: investorForm.fullName,
            role: 'investor',
            phone: investorForm.phone,
            investment_type: investorForm.investmentType,
            company_name: investorForm.companyName,
          },
        },
      });
      if (error) throw error;
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        setError('This email is already in use. Please sign in instead.');
        setInvestorStep(1);
        return;
      }
      switchView('pendingVerificationInvestor');
    } catch (err: any) {
      setError(err.message || 'Failed to submit investor application.');
      setInvestorStep(1);
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}?reset=true`,
      });
      if (error) throw error;
      switchView('resetConfirmation');
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email.');
    } finally {
      setSubmitting(false);
    }
  };

  const headings: Record<AuthView, { title: string; subtitle: string }> = {
    login: {
      title: 'Welcome back to AfriEstate',
      subtitle: 'Sign in with your email, Gmail account, or Outlook account to access saved assets and direct enquiries.',
    },
    signup: {
      title: 'Create your AfriEstate account',
      subtitle: 'Select your portfolio profile or continue instantly with your Gmail or Outlook account.',
    },
    userSignup: {
      title: 'Property Seeker registration',
      subtitle: 'Save properties, compare residences, and schedule private tours across 54 markets.',
    },
    agentSignup: {
      title: 'Agent & Agency onboarding',
      subtitle: 'List verified developments, manage buyer leads, and publish cadastre-checked estates.',
    },
    investorSignup: {
      title: 'Investor desk registration',
      subtitle: 'Access commercial REITs, student housing yields, and institutional co-investments.',
    },
    pendingVerificationAgent: {
      title: 'Agency application received',
      subtitle: 'Our compliance desk is reviewing your agency credentials.',
    },
    pendingVerificationInvestor: {
      title: 'Investor application received',
      subtitle: 'Our compliance desk is reviewing your accreditation documents.',
    },
    forgotPassword: {
      title: 'Reset your password',
      subtitle: 'Enter your registered email address and we will dispatch a secure recovery link.',
    },
    resetConfirmation: {
      title: 'Recovery email sent',
      subtitle: 'Please check your inbox for instructions to set a new password.',
    },
    confirmEmail: {
      title: 'Verify your inbox',
      subtitle: 'We sent a secure confirmation link to your email address. Open it to complete your sign in.',
    },
  };

  const activeHeading = headings[view] || headings.login;

  return (
    <section className="w-full min-h-[calc(100vh-4rem)] grid grid-cols-1 lg:grid-cols-12 bg-[#FAF8F5] dark:bg-slate-950">
      {/* Left Full-Bleed Architectural Editorial Panel */}
      <div className="relative lg:col-span-5 xl:col-span-6 bg-[#081713] text-white overflow-hidden min-h-[280px] lg:min-h-full flex flex-col justify-between p-8 sm:p-12 lg:p-16">
        <img
          src="/images/coastal_mansion_1779978805301.png"
          alt="Luxury African Coastal Residence"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover opacity-55 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#081713] via-[#0B1F1A]/70 to-[#081713]/45" />

        <div className="relative z-10 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-200 hover:text-amber-300 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Back to Marketplace</span>
          </button>
          <span className="text-xs font-medium text-amber-300 tracking-wide">
            Pan-African Real Estate Network
          </span>
        </div>

        <div className="relative z-10 my-auto py-8 lg:py-12 max-w-xl">
          <p className="text-xs uppercase tracking-widest font-semibold text-amber-300 mb-3">
            Verified Cross-Border Access
          </p>
          <h1
            className="text-3xl sm:text-4xl xl:text-5xl font-bold font-heading tracking-tight text-white leading-tight"
            style={{ textWrap: 'balance' }}
          >
            Own, Lease, and Invest Across Africa with Certainty
          </h1>
          <p className="mt-4 text-sm sm:text-base text-slate-200 leading-relaxed max-w-lg">
            One unified account unlocks vetted listings, land-registry verification dossiers, AI market forecasting, and direct agent communications across 54 countries.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-6 pt-6 bg-black/25 backdrop-blur-md rounded-2xl p-5">
          <div>
            <p className="text-lg sm:text-xl font-bold font-mono tabular-nums text-amber-300">54</p>
            <p className="text-xs text-slate-300 mt-0.5">African Markets</p>
          </div>
          <div>
            <p className="text-lg sm:text-xl font-bold font-mono tabular-nums text-white">100%</p>
            <p className="text-xs text-slate-300 mt-0.5">Deed Vetting</p>
          </div>
          <div>
            <p className="text-lg sm:text-xl font-bold font-mono tabular-nums text-emerald-300">45+</p>
            <p className="text-xs text-slate-300 mt-0.5">Currencies Supported</p>
          </div>
        </div>
      </div>

      {/* Right Full-Page Interactive Authentication Workspace */}
      <div className="lg:col-span-7 xl:col-span-6 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-24 py-10 lg:py-14 bg-white dark:bg-slate-900">
        <div className="w-full max-w-xl mx-auto">
          {/* Top Mode Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => switchView('login')}
                className={`px-5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  !isSignUpMode
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchView('signup')}
                className={`px-5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  isSignUpMode
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            {onSwitchToPricing && (
              <button
                type="button"
                onClick={onSwitchToPricing}
                className="text-xs font-semibold text-emerald-800 dark:text-amber-300 hover:underline whitespace-nowrap"
              >
                View Membership Plans
              </button>
            )}
          </div>

          {/* Page Title */}
          <div className="mb-7">
            <h2
              className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 dark:text-white tracking-tight"
              style={{ textWrap: 'balance' }}
            >
              {activeHeading.title}
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {activeHeading.subtitle}
            </p>
          </div>

          {/* Error Banner (No thick left accent stripe) */}
          {error && (
            <div
              role="alert"
              className="mb-6 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 px-4 py-3.5 text-sm flex items-start gap-3"
            >
              <ExclamationCircleIcon className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* VIEW: LOGIN */}
          {view === 'login' && (
            <div className="space-y-6">
              <ProviderAuthButtons
                mode="signin"
                setError={setError}
                onMagicLinkSent={() => switchView('confirmEmail')}
              />

              <div className="flex items-center gap-3 text-xs text-slate-400 uppercase tracking-wider">
                <span className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                <span>or sign in with email</span>
                <span className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
              </div>

              <form onSubmit={handleEmailLogin} className="space-y-4">
                <AuthInput
                  label="Email Address"
                  id="auth-login-email"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@company.com"
                  autoComplete="email"
                />

                <div>
                  <AuthInput
                    label="Password"
                    id="auth-login-password"
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    icon={showLoginPassword ? EyeSlashIcon : EyeIcon}
                    onIconClick={() => setShowLoginPassword((prev) => !prev)}
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      type="button"
                      onClick={() => switchView('forgotPassword')}
                      className="text-xs font-semibold text-emerald-800 dark:text-amber-300 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-6 rounded-xl bg-[#0B1F1A] hover:bg-emerald-900 dark:bg-amber-400 dark:hover:bg-amber-300 text-white dark:text-slate-950 font-semibold text-sm transition-colors shadow-sm disabled:opacity-60"
                >
                  {submitting ? 'Signing In...' : 'Sign In to AfriEstate'}
                </button>
              </form>

              <p className="text-center text-sm text-slate-600 dark:text-slate-400 pt-2">
                New to AfriEstate?{' '}
                <button
                  type="button"
                  onClick={() => switchView('signup')}
                  className="font-semibold text-emerald-800 dark:text-amber-300 hover:underline"
                >
                  Create an account
                </button>
              </p>
            </div>
          )}

          {/* VIEW: SIGNUP ROLE CHOOSER */}
          {view === 'signup' && (
            <div className="space-y-6">
              <ProviderAuthButtons
                mode="signup"
                roleHint="user"
                setError={setError}
                onMagicLinkSent={() => switchView('confirmEmail')}
              />

              <div className="flex items-center gap-3 text-xs text-slate-400 uppercase tracking-wider">
                <span className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                <span>or choose your account profile</span>
                <span className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
              </div>

              <div className="space-y-3">
                {[
                  {
                    role: 'userSignup' as AuthView,
                    icon: UserIcon,
                    title: 'Property Seeker',
                    desc: 'Browse residences, compare yields, save searches, and book verified tours.',
                  },
                  {
                    role: 'agentSignup' as AuthView,
                    icon: BuildingStorefrontIcon,
                    title: 'Agent / Agency',
                    desc: 'Publish verified listings, manage qualified leads, and access digital deed verification.',
                  },
                  {
                    role: 'investorSignup' as AuthView,
                    icon: BanknotesIcon,
                    title: 'Investor',
                    desc: 'Unlock institutional co-investments, commercial REITs, and PBSA portfolios.',
                  },
                ].map((opt) => (
                  <button
                    key={opt.role}
                    type="button"
                    onClick={() => switchView(opt.role)}
                    className="w-full text-left p-5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 hover:bg-emerald-950/5 dark:hover:bg-slate-800 flex items-center justify-between gap-4 group transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center text-emerald-800 dark:text-amber-300 group-hover:bg-[#0B1F1A] group-hover:text-amber-300 transition-colors shrink-0">
                        <opt.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">
                          {opt.title}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                          {opt.desc}
                        </p>
                      </div>
                    </div>
                    <ArrowRightIcon className="w-5 h-5 text-slate-400 group-hover:text-emerald-800 dark:group-hover:text-amber-300 group-hover:translate-x-1 transition-all shrink-0" />
                  </button>
                ))}

                {/* Hotel Manager Button directly below Investor */}
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectHotelManager) {
                      onSelectHotelManager();
                    }
                  }}
                  className="w-full text-left p-5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 hover:bg-emerald-950/5 dark:hover:bg-slate-800 flex items-center justify-between gap-4 group transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center text-emerald-800 dark:text-amber-300 group-hover:bg-[#0B1F1A] group-hover:text-amber-300 transition-colors shrink-0">
                      <BuildingOffice2Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">
                        Hotel Manager
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                        Register your hotel, configure rooms &amp; dynamic rates, and launch your Hotel Command Center.
                      </p>
                    </div>
                  </div>
                  <ArrowRightIcon className="w-5 h-5 text-slate-400 group-hover:text-emerald-800 dark:group-hover:text-amber-300 group-hover:translate-x-1 transition-all shrink-0" />
                </button>
              </div>

              <p className="text-center text-sm text-slate-600 dark:text-slate-400">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchView('login')}
                  className="font-semibold text-emerald-800 dark:text-amber-300 hover:underline"
                >
                  Sign In
                </button>
              </p>
            </div>
          )}

          {/* VIEW: USER SIGNUP */}
          {view === 'userSignup' && (
            <div className="space-y-5">
              <button
                type="button"
                onClick={() => switchView('signup')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                <ArrowLeftIcon className="w-3.5 h-3.5" />
                <span>Change account type</span>
              </button>

              <ProviderAuthButtons
                mode="signup"
                roleHint="user"
                setError={setError}
                onMagicLinkSent={() => switchView('confirmEmail')}
              />

              <div className="flex items-center gap-3 text-xs text-slate-400 uppercase tracking-wider">
                <span className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                <span>or register with email</span>
                <span className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
              </div>

              <form onSubmit={handleUserSignup} className="space-y-4">
                <AuthInput
                  label="Full Name"
                  name="fullName"
                  value={userForm.fullName}
                  onChange={(e) => setUserForm((p) => ({ ...p, fullName: e.target.value }))}
                  placeholder="Amara Okafor"
                />
                <AuthInput
                  label="Email Address"
                  name="email"
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="amara@example.com"
                />
                <AuthInput
                  label="Password"
                  name="password"
                  type={showUserPassword ? 'text' : 'password'}
                  value={userForm.password}
                  onChange={(e) => setUserForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder="Minimum 8 characters"
                  icon={showUserPassword ? EyeSlashIcon : EyeIcon}
                  onIconClick={() => setShowUserPassword((prev) => !prev)}
                />
                <PasswordStrengthMeter criteria={isPasswordStrong(userForm.password)} />

                <label className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={userForm.agreeToTerms}
                    onChange={(e) => setUserForm((p) => ({ ...p, agreeToTerms: e.target.checked }))}
                    className="h-4 w-4 rounded text-emerald-700 focus:ring-emerald-700"
                  />
                  <span>I agree to the AfriEstate Terms of Service and Privacy Policy.</span>
                </label>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-6 rounded-xl bg-[#0B1F1A] hover:bg-emerald-900 dark:bg-amber-400 dark:hover:bg-amber-300 text-white dark:text-slate-950 font-semibold text-sm transition-colors shadow-sm disabled:opacity-60"
                >
                  {submitting ? 'Creating Account...' : 'Create Property Seeker Account'}
                </button>
              </form>
            </div>
          )}

          {/* VIEW: AGENT SIGNUP */}
          {view === 'agentSignup' && (
            <div className="space-y-5">
              <button
                type="button"
                onClick={() => switchView('signup')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                <ArrowLeftIcon className="w-3.5 h-3.5" />
                <span>Change account type</span>
              </button>

              <ProviderAuthButtons
                mode="signup"
                roleHint="agent"
                setError={setError}
                onMagicLinkSent={() => switchView('confirmEmail')}
              />

              <form onSubmit={handleAgentSignup} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <AuthInput
                    label="Full Name / Agency Name"
                    name="fullName"
                    value={agentForm.fullName}
                    onChange={(e) => setAgentForm((p) => ({ ...p, fullName: e.target.value }))}
                  />
                  <AuthInput
                    label="Work Email"
                    name="email"
                    type="email"
                    value={agentForm.email}
                    onChange={(e) => setAgentForm((p) => ({ ...p, email: e.target.value }))}
                  />
                </div>
                <AuthInput
                  label="Password"
                  name="password"
                  type={showAgentPassword ? 'text' : 'password'}
                  value={agentForm.password}
                  onChange={(e) => setAgentForm((p) => ({ ...p, password: e.target.value }))}
                  icon={showAgentPassword ? EyeSlashIcon : EyeIcon}
                  onIconClick={() => setShowAgentPassword((prev) => !prev)}
                />
                <PasswordStrengthMeter criteria={isPasswordStrong(agentForm.password)} />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <AuthInput
                    label="Contact Phone"
                    name="phone"
                    type="tel"
                    value={agentForm.phone}
                    onChange={(e) => setAgentForm((p) => ({ ...p, phone: e.target.value }))}
                  />
                  <AuthInput
                    label="Business Reg. Number"
                    name="businessRegNumber"
                    value={agentForm.businessRegNumber}
                    onChange={(e) => setAgentForm((p) => ({ ...p, businessRegNumber: e.target.value }))}
                    note="Optional for solo agents"
                    required={false}
                  />
                </div>
                <AuthInput
                  label="Office Address"
                  name="officeAddress"
                  value={agentForm.officeAddress}
                  onChange={(e) => setAgentForm((p) => ({ ...p, officeAddress: e.target.value }))}
                />
                <FileUploadField
                  label="ID or Business Registration Certificate"
                  file={agentIdDoc}
                  onFileChange={setAgentIdDoc}
                  acceptedTypes=".pdf,.jpg,.png"
                  required
                />

                <label className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agentForm.agreeToTerms}
                    onChange={(e) => setAgentForm((p) => ({ ...p, agreeToTerms: e.target.checked }))}
                    className="h-4 w-4 rounded text-emerald-700 focus:ring-emerald-700"
                  />
                  <span>I agree to the Agent Verification Terms & Conditions.</span>
                </label>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-6 rounded-xl bg-[#0B1F1A] hover:bg-emerald-900 dark:bg-amber-400 dark:hover:bg-amber-300 text-white dark:text-slate-950 font-semibold text-sm transition-colors shadow-sm disabled:opacity-60"
                >
                  {submitting ? 'Submitting...' : 'Submit Agency for Verification'}
                </button>
              </form>
            </div>
          )}

          {/* VIEW: INVESTOR SIGNUP */}
          {view === 'investorSignup' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => switchView('signup')}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                  <ArrowLeftIcon className="w-3.5 h-3.5" />
                  <span>Change account type</span>
                </button>
                <span className="font-mono text-xs font-semibold text-emerald-800 dark:text-amber-300 tabular-nums">
                  Step {investorStep} of 3
                </span>
              </div>

              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-700 dark:bg-amber-400 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${(investorStep / 3) * 100}%` }}
                />
              </div>

              {investorStep === 1 && (
                <ProviderAuthButtons
                  mode="signup"
                  roleHint="investor"
                  setError={setError}
                  onMagicLinkSent={() => switchView('confirmEmail')}
                />
              )}

              <form onSubmit={handleInvestorSignup} className="space-y-4">
                {investorStep === 1 && (
                  <>
                    <AuthInput
                      label="Full Name"
                      name="fullName"
                      value={investorForm.fullName}
                      onChange={(e) => setInvestorForm((p) => ({ ...p, fullName: e.target.value }))}
                    />
                    <AuthInput
                      label="Email Address"
                      name="email"
                      type="email"
                      value={investorForm.email}
                      onChange={(e) => setInvestorForm((p) => ({ ...p, email: e.target.value }))}
                    />
                    <AuthInput
                      label="Password"
                      name="password"
                      type={showInvestorPassword ? 'text' : 'password'}
                      value={investorForm.password}
                      onChange={(e) => setInvestorForm((p) => ({ ...p, password: e.target.value }))}
                      icon={showInvestorPassword ? EyeSlashIcon : EyeIcon}
                      onIconClick={() => setShowInvestorPassword((prev) => !prev)}
                    />
                    <PasswordStrengthMeter criteria={isPasswordStrong(investorForm.password)} />
                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={handleInvestorNext}
                        className="px-6 py-3 rounded-xl bg-[#0B1F1A] hover:bg-emerald-900 dark:bg-amber-400 dark:text-slate-950 text-white text-sm font-semibold transition-colors"
                      >
                        Continue
                      </button>
                    </div>
                  </>
                )}

                {investorStep === 2 && (
                  <>
                    <AuthInput
                      label="Phone Number"
                      name="phone"
                      type="tel"
                      value={investorForm.phone}
                      onChange={(e) => setInvestorForm((p) => ({ ...p, phone: e.target.value }))}
                    />
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Investment Entity Type
                      </label>
                      <select
                        value={investorForm.investmentType}
                        onChange={(e) => setInvestorForm((p) => ({ ...p, investmentType: e.target.value }))}
                        className="w-full px-4 py-3.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 border-0 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-800 outline-none"
                      >
                        <option value="Individual">Individual Investor</option>
                        <option value="Corporate">Corporate / Institutional Fund</option>
                      </select>
                    </div>
                    {investorForm.investmentType === 'Corporate' && (
                      <AuthInput
                        label="Company / Fund Name"
                        name="companyName"
                        value={investorForm.companyName}
                        onChange={(e) => setInvestorForm((p) => ({ ...p, companyName: e.target.value }))}
                      />
                    )}
                    <div className="flex justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => setInvestorStep(1)}
                        className="px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setInvestorStep(3)}
                        className="px-6 py-3 rounded-xl bg-[#0B1F1A] hover:bg-emerald-900 dark:bg-amber-400 dark:text-slate-950 text-white text-sm font-semibold"
                      >
                        Continue
                      </button>
                    </div>
                  </>
                )}

                {investorStep === 3 && (
                  <>
                    <FileUploadField
                      label="Proof of Identity (ID / Passport)"
                      file={investorIdDoc}
                      onFileChange={setInvestorIdDoc}
                      acceptedTypes=".pdf,.jpg,.png"
                      required
                    />
                    <label className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={investorForm.agreeToTerms}
                        onChange={(e) => setInvestorForm((p) => ({ ...p, agreeToTerms: e.target.checked }))}
                        className="h-4 w-4 rounded text-emerald-700 focus:ring-emerald-700"
                      />
                      <span>I agree to the Investor Accreditation & Escrow Terms.</span>
                    </label>
                    <div className="flex justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => setInvestorStep(2)}
                        className="px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={submitting || !investorForm.agreeToTerms}
                        className="px-6 py-3 rounded-xl bg-[#0B1F1A] hover:bg-emerald-900 dark:bg-amber-400 dark:text-slate-950 text-white text-sm font-semibold disabled:opacity-50"
                      >
                        {submitting ? 'Submitting...' : 'Submit Application'}
                      </button>
                    </div>
                  </>
                )}
              </form>
            </div>
          )}

          {/* VIEW: FORGOT PASSWORD */}
          {view === 'forgotPassword' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <AuthInput
                label="Registered Email Address"
                id="auth-reset-email"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="name@company.com"
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-6 rounded-xl bg-[#0B1F1A] hover:bg-emerald-900 dark:bg-amber-400 dark:text-slate-950 text-white font-semibold text-sm transition-colors"
              >
                {submitting ? 'Sending...' : 'Send Recovery Link'}
              </button>
              <button
                type="button"
                onClick={() => switchView('login')}
                className="w-full text-center text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 pt-2"
              >
                Return to Sign In
              </button>
            </form>
          )}

          {/* VIEW: STATUS CONFIRMATIONS */}
          {(view === 'confirmEmail' ||
            view === 'resetConfirmation' ||
            view === 'pendingVerificationAgent' ||
            view === 'pendingVerificationInvestor') && (
            <div className="p-8 rounded-2xl bg-slate-100/90 dark:bg-slate-800/80 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 mx-auto flex items-center justify-center">
                <CheckBadgeIcon className="w-8 h-8" />
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed max-w-md mx-auto">
                {view === 'pendingVerificationAgent' &&
                  'Thank you for registering as an accredited agency. Your verification dossier is under compliance review (typically 1–2 business days).'}
                {view === 'pendingVerificationInvestor' &&
                  'Thank you for applying to the AfriEstate Investor Desk. We will notify you via email once your accreditation clears.'}
                {view === 'confirmEmail' &&
                  'A secure sign-in / verification link has been sent to your inbox. Click the link in your Gmail or Outlook inbox to enter AfriEstate.'}
                {view === 'resetConfirmation' &&
                  'If an account exists for that email address, a password reset link is on its way.'}
              </p>
              <button
                type="button"
                onClick={() => switchView('login')}
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#0B1F1A] hover:bg-emerald-900 dark:bg-amber-400 dark:text-slate-950 text-white text-sm font-semibold transition-colors"
              >
                Back to Sign In
              </button>
            </div>
          )}

          {/* Security Footer Line */}
          <div className="mt-10 pt-6 flex items-center justify-between text-xs text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheckIcon className="w-4 h-4 text-emerald-600" />
              Encrypted Supabase & OAuth 2.0 Authentication
            </span>
            <span>Gmail · Outlook · Email</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AuthPage;
