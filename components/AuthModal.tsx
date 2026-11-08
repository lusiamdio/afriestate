import React, { useState, useEffect, useRef } from 'react';
import { CloseIcon } from './icons/NavIcons';
import { supabase } from '../lib/supabase';
import type { User } from '../types';
import { GoogleIcon, AppleIcon } from './icons/SocialIcons';
import { EyeIcon, EyeSlashIcon, CheckIcon, CameraIcon, ArrowUpTrayIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';
import { BuildingStorefrontIcon, UserIcon } from '@heroicons/react/24/solid';
import { BanknotesIcon } from './icons/ActionIcons';

type AuthView = 'login' | 'signup' | 'userSignup' | 'agentSignup' | 'investorSignup' | 'pendingVerificationAgent' | 'pendingVerificationInvestor' | 'forgotPassword' | 'resetConfirmation' | 'confirmEmail';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
  initialView?: AuthView;
  onSwitchToPricing?: () => void;
  onSuperAdminLogin?: () => void;
}

// --- Helper Components ---
const InputField: React.FC<{label: string, id?: string, type?: string, value: string, name?: string, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void, icon?: React.ElementType, onIconClick?: () => void, disabled?: boolean, placeholder?: string, containerClassName?: string, note?: string, required?: boolean}> = ({ label, id, type = 'text', value, name, onChange, icon: Icon, onIconClick, disabled, placeholder, containerClassName, note, required=true }) => (
    <div className={containerClassName}>
        <label htmlFor={id || name} className="block text-sm font-bold text-slate-700 mb-2">{label}</label>
        <div className="relative">
            {type === 'textarea' ? ( <textarea id={id || name} name={name || id} value={value} onChange={onChange} disabled={disabled} placeholder={placeholder} required={required} className="input-base" rows={2}></textarea>
            ) : ( <input id={id || name} name={name || id} type={type} value={value} onChange={onChange} disabled={disabled} placeholder={placeholder} required={required} className="input-base" /> )}
            {Icon && <button type="button" onClick={onIconClick} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500"><Icon className="h-5 w-5" /></button>}
        </div>
        {note && <p className="text-xs text-slate-400 mt-1">{note}</p>}
    </div>
);

const FileInput: React.FC<{ label: string; file: File | null; onFileChange: (file: File | null) => void; acceptedTypes: string, required?: boolean }> = ({ label, file, onFileChange, acceptedTypes, required=false }) => (
    <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">{label}</label>
        <div className="mt-1">
            <label htmlFor={label} className="relative cursor-pointer bg-slate-50 hover:bg-slate-100 rounded-xl font-medium text-brand-primary border-2 border-dashed border-slate-200 hover:border-brand-primary transition-colors p-4 flex justify-center items-center gap-2">
                <ArrowUpTrayIcon className="w-5 h-5" />
                <span className="text-sm">{file ? 'Change file' : 'Upload file'}</span>
                <input id={label} name={label} type="file" className="sr-only" onChange={(e) => onFileChange(e.target.files ? e.target.files[0] : null)} accept={acceptedTypes} required={required} />
            </label>
            {file && <p className="text-xs text-slate-500 mt-2 truncate font-medium">Selected: {file.name}</p>}
        </div>
    </div>
);

const Checkbox: React.FC<{id: string, name: string, checked: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, children: React.ReactNode}> = ({id, name, checked, onChange, children}) => (
    <label htmlFor={id} className="flex items-center gap-3 text-sm text-slate-600 cursor-pointer group">
        <input type="checkbox" id={id} name={name} checked={checked} onChange={onChange} className="h-5 w-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary cursor-pointer transition-colors" />
        <span className="group-hover:text-brand-dark transition-colors">{children}</span>
    </label>
);

const SocialButton: React.FC<{onClick: () => void, icon: React.ElementType, children: React.ReactNode}> = ({ onClick, icon: Icon, children }) => (
    <button type="button" onClick={onClick} className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
        <Icon className="w-5 h-5"/>{children}
    </button>
);

const SocialLogins: React.FC<{onLoginSuccess: () => void}> = ({ onLoginSuccess }) => (
    <div className="grid grid-cols-2 gap-3">
        <SocialButton onClick={() => onLoginSuccess()} icon={GoogleIcon}>Google</SocialButton>
        <SocialButton onClick={() => onLoginSuccess()} icon={AppleIcon}>Apple</SocialButton>
    </div>
);

const SignupOptionCard: React.FC<{icon: React.ElementType, title: string, description: string, onClick: () => void}> = ({ icon: Icon, title, description, onClick }) => (
    <button onClick={onClick} className="w-full text-left p-5 border-2 border-slate-100 rounded-xl flex items-center gap-5 hover:border-brand-primary hover:shadow-lg transition-all duration-300 group bg-white">
        <div className="bg-brand-light p-4 rounded-xl group-hover:bg-brand-primary transition-colors duration-300">
            <Icon className="w-7 h-7 text-brand-primary group-hover:text-brand-secondary transition-colors duration-300"/>
        </div>
        <div>
            <h3 className="font-heading font-bold text-lg text-brand-dark group-hover:text-brand-primary transition-colors">{title}</h3>
            <p className="text-sm text-slate-500 font-light mt-1">{description}</p>
        </div>
    </button>
);

const FormSection: React.FC<{title: string, children: React.ReactNode}> = ({ title, children }) => (
    <fieldset className="space-y-4 mb-6">
        <legend className="text-sm font-bold uppercase tracking-widest text-brand-secondary border-b-2 border-slate-100 w-full pb-3 mb-4">{title}</legend>
        {children}
    </fieldset>
);

const ProgressBar: React.FC<{currentStep: number, totalSteps: number}> = ({ currentStep, totalSteps }) => (
    <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Step {currentStep} of {totalSteps}</p>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
            <div className="bg-brand-primary h-1.5 rounded-full transition-all duration-300" style={{ width: `${(currentStep / totalSteps) * 100}%` }}></div>
        </div>
    </div>
);

interface PasswordCriteria { length: boolean; uppercase: boolean; lowercase: boolean; number: boolean; special: boolean; all: boolean; }
const isPasswordStrong = (password: string): PasswordCriteria => {
    const criteria = { length: password.length >= 8, uppercase: /[A-Z]/.test(password), lowercase: /[a-z]/.test(password), number: /[0-9]/.test(password), special: /[!@#$%^&*]/.test(password) };
    return { ...criteria, all: Object.values(criteria).every(v => v) };
};

const CriteriaItem: React.FC<{ label: string, met: boolean }> = ({ label, met }) => (
    <div className={`flex items-center gap-1.5 transition-colors ${met ? 'text-green-600 dark:text-green-500' : 'text-slate-400'}`}>
        <div className={`w-3.5 h-3.5 flex-shrink-0 rounded-full flex items-center justify-center ${met ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
            {met && <CheckIcon className="w-2.5 h-2.5 text-white stroke-2" />}
        </div>
        {label}
    </div>
);

const PasswordStrengthMeter: React.FC<{ criteria: PasswordCriteria }> = ({ criteria }) => (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <CriteriaItem label="8+ characters" met={criteria.length} />
        <CriteriaItem label="1 uppercase" met={criteria.uppercase} />
        <CriteriaItem label="1 lowercase" met={criteria.lowercase} />
        <CriteriaItem label="1 number" met={criteria.number} />
        <CriteriaItem label="1 special" met={criteria.special} />
    </div>
);

// --- Sub-components for each view ---

const LoginView: React.FC<{onLoginSuccess: () => void, onSwitchToSignup: () => void, onSwitchToForgotPassword: () => void, setError: (e: string) => void, onSuperAdminLogin?: () => void}> = ({ onLoginSuccess, onSwitchToSignup, onSwitchToForgotPassword, setError, onSuperAdminLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (email === 'simao@neurogrowthlabs.co.za' && password === 'AfriEstate2@') {
            if (onSuperAdminLogin) onSuperAdminLogin();
            return;
        }

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
            onLoginSuccess();
            // The onAuthStateChange event in App.tsx will handle updating the user context
        } catch (error: any) {
            console.error("Supabase Email Login Error", error);
            if (error.message === "Email not confirmed") {
                setError("Please verify your email address. Check your inbox for the confirmation link.");
            } else if (error.message === "Invalid login credentials") {
                setError("Invalid email or password. Please try again.");
            } else {
                setError(error.message || "Failed to log in.");
            }
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            });
            if (error) throw error;
        } catch (error: any) {
            console.error("Supabase Login Error", error);
            setError(error.message || "Failed to log in with Google.");
        }
    };

    return (
        <div className="space-y-4 animate-fade-in text-center py-2">
            <form onSubmit={handleEmailLogin} className="space-y-4 text-left">
                <InputField label="Email Address" id="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                <div>
                   <InputField 
                       label="Password" 
                       id="login-password" 
                       type={showPassword ? "text" : "password"} 
                       value={password} 
                       onChange={e => setPassword(e.target.value)} 
                       icon={showPassword ? EyeSlashIcon : EyeIcon} 
                       onIconClick={() => setShowPassword(!showPassword)}
                   />
                   <div className="flex justify-end mt-1">
                       <button type="button" onClick={onSwitchToForgotPassword} className="text-xs font-semibold text-brand-primary hover:underline">Forgot password?</button>
                   </div>
                </div>
                <button type="submit" className="w-full btn-primary">Log In</button>
            </form>
            
            <div className="relative flex items-center justify-center pt-2">
                <div className="border-t border-slate-200 dark:border-slate-700 w-full absolute"></div>
                <span className="bg-white dark:bg-brand-dark px-2 text-xs text-slate-500 relative z-10 uppercase tracking-wider">or continue with</span>
            </div>

            <button 
                onClick={handleGoogleLogin} 
                className="w-full flex items-center justify-center gap-3 px-4 py-3.5 border-2 border-slate-100 hover:border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all duration-300"
                type="button"
            >
                <GoogleIcon className="w-6 h-6"/>
                Continue with Google
            </button>
            <div className="pt-2 flex items-center justify-center gap-2">
                <span className="text-sm text-slate-500">Not an investor/user yet?</span>
                <button type="button" onClick={onSwitchToSignup} className="text-sm font-semibold text-brand-primary hover:underline focus:outline-none">Sign up</button>
            </div>
        </div>
    );
};

const SignupView: React.FC<{ onSwitchToLogin: () => void; onSignupRole: (role: 'user'|'agent'|'investor') => void; }> = ({ onSwitchToLogin, onSignupRole }) => (
    <div className="animate-fade-in space-y-4 text-center py-2">
        <p className="text-center text-slate-500 font-light mb-6">Select your journey to begin transforming your real estate experience.</p>
        <div className="space-y-4">
            <div className="transform hover:-translate-y-1 transition-all duration-300">
                <SignupOptionCard icon={UserIcon} title="Property Seeker" description="Browse, save, and tour premium properties." onClick={() => onSignupRole('user')} />
            </div>
            <div className="transform hover:-translate-y-1 transition-all duration-300">
                <SignupOptionCard icon={BuildingStorefrontIcon} title="Agent / Agency" description="List and manage your exclusive portfolio." onClick={() => onSignupRole('agent')} />
            </div>
            <div className="transform hover:-translate-y-1 transition-all duration-300">
                <SignupOptionCard icon={BanknotesIcon} title="Investor" description="Access exclusive co-investment deals." onClick={() => onSignupRole('investor')} />
            </div>
        </div>
        
        <div className="relative flex items-center justify-center pt-4">
            <div className="border-t border-slate-200 dark:border-slate-700 w-full absolute"></div>
            <span className="bg-white px-2 text-xs text-slate-500 relative z-10 uppercase tracking-wider">or continue with</span>
        </div>

        <button 
            onClick={async () => {
                try {
                    await supabase.auth.signInWithOAuth({
                        provider: 'google',
                        options: {
                            queryParams: { access_type: 'offline', prompt: 'consent' },
                        },
                    });
                } catch (error) {
                    console.error('Google signup error', error);
                }
            }} 
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 border-2 border-slate-100 hover:border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all duration-300 mt-6"
            type="button"
        >
            <GoogleIcon className="w-6 h-6"/>
            Continue with Google
        </button>

        <p className="text-center text-sm text-slate-500 pt-4">Already have an account? <button type="button" onClick={onSwitchToLogin} className="font-semibold text-brand-primary hover:underline focus:outline-none">Log In</button></p>
    </div>
);

const UserSignupView: React.FC<{onSignupSuccess: () => void, onRequireEmailConfirmation: () => void, onSwitchToLogin: () => void, setError: (e: string) => void}> = ({ onSignupSuccess, onRequireEmailConfirmation, onSwitchToLogin, setError }) => {
    const [formData, setFormData] = useState({ fullName: '', email: '', password: '', agreeToTerms: false });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!isPasswordStrong(formData.password).all) { setError("Password doesn't meet requirements."); return; }
        if (!formData.agreeToTerms) { setError("You must agree to the Terms & Conditions."); return; }

        try {
            const { data, error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName,
                        role: 'user',
                    }
                }
            });
            if (error) throw error;
            
            // Check if we need email verification
            if (data.user && data.user.identities && data.user.identities.length === 0) {
                 setError('This email is already in use. Please log in.');
                 return;
            }

            if (!data.session) {
                onRequireEmailConfirmation();
            } else {
                onSignupSuccess();
            }
        } catch (error: any) {
            console.error("Supabase Signup Error", error);
            setError(error.message || "Failed to sign up.");
        }
    };

    return (
        <form onSubmit={handleSignup} className="space-y-4 animate-fade-in">
             <InputField label="Full Name" name="fullName" value={formData.fullName} onChange={handleInputChange} />
             <InputField label="Email Address" name="email" type="email" value={formData.email} onChange={handleInputChange} />
             <InputField label="Password" name="password" type="password" value={formData.password} onChange={handleInputChange} />
             <PasswordStrengthMeter criteria={isPasswordStrong(formData.password)} />
             <Checkbox id="agreeToTerms" name="agreeToTerms" checked={formData.agreeToTerms} onChange={handleInputChange}>I agree to the <a href="#" target="_blank" className="font-semibold text-brand-primary hover:underline">Terms & Conditions</a>.</Checkbox>
            <button type="submit" className="w-full btn-primary">Create Account</button>
            <p className="text-center text-sm text-slate-500 dark:text-slate-400">Already have an account? <button type="button" onClick={onSwitchToLogin} className="font-semibold text-brand-primary hover:underline">Log In</button></p>
        </form>
    );
};

const AgentSignupView: React.FC<{ onSignupSuccess: () => void, onSwitchToLogin: () => void, setError: (e: string) => void }> = ({ onSignupSuccess, onSwitchToLogin, setError }) => {
    const [formData, setFormData] = useState({ fullName: '', email: '', password: '', phone: '', officeAddress: '', businessRegNumber: '', agentLicense: '', agreeToTerms: false });
    const [idDoc, setIdDoc] = useState<File | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!isPasswordStrong(formData.password).all) { setError("Password doesn't meet requirements."); return; }
        if (!idDoc) { setError("Please upload your ID or Business Certificate for verification."); return; }
        if (!formData.agreeToTerms) { setError("You must agree to the Agent Terms & Conditions."); return; }
        
        try {
            const { data, error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName,
                        role: 'agent',
                        phone: formData.phone,
                        officeAddress: formData.officeAddress,
                        businessRegNumber: formData.businessRegNumber,
                        agentLicense: formData.agentLicense,
                    }
                }
            });
            if (error) throw error;
            
            if (data.user && data.user.identities && data.user.identities.length === 0) {
                 setError('This email is already in use. Please log in.');
                 return;
            }

            onSignupSuccess(); 
        } catch (error: any) {
            console.error("Supabase Agent Signup Error", error);
            setError(error.message || "Failed to sign up.");
        }
    };
    
    return (
         <form onSubmit={handleSignup} className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 animate-fade-in">
            <FormSection title="Account Details">
                <InputField label="Full Name / Agency Name" name="fullName" value={formData.fullName} onChange={handleInputChange} />
                <InputField label="Contact Email" name="email" type="email" value={formData.email} onChange={handleInputChange} />
                <InputField label="Password" name="password" type="password" value={formData.password} onChange={handleInputChange} />
                <PasswordStrengthMeter criteria={isPasswordStrong(formData.password)} />
            </FormSection>
            <FormSection title="Business Information">
                <InputField label="Contact Phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} />
                <InputField label="Office Address" name="officeAddress" value={formData.officeAddress} onChange={handleInputChange} />
                <InputField label="Business Reg. Number" name="businessRegNumber" value={formData.businessRegNumber} onChange={handleInputChange} note="(Optional for individuals)" required={false} />
            </FormSection>
            <FormSection title="Verification">
                <FileInput label="ID or Business Certificate" file={idDoc} onFileChange={setIdDoc} acceptedTypes=".pdf,.jpg,.png" required />
            </FormSection>
            
            <Checkbox id="agreeToTerms" name="agreeToTerms" checked={formData.agreeToTerms} onChange={handleInputChange}>I agree to the <a href="#" target="_blank" className="font-semibold text-brand-primary hover:underline">Agent Terms & Conditions</a>.</Checkbox>
            <button type="submit" className="w-full btn-primary">Submit for Verification</button>
            <p className="text-center text-sm text-slate-500 dark:text-slate-400">Already have an account? <button type="button" onClick={onSwitchToLogin} className="font-semibold text-brand-primary hover:underline">Log In</button></p>
        </form>
    );
};

const InvestorSignupView: React.FC<{ onSignupSuccess: () => void, setError: (e: string) => void, onSwitchToLogin: () => void }> = ({ onSignupSuccess, setError, onSwitchToLogin }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({ fullName: '', email: '', password: '', phone: '', investmentType: 'Individual', companyName: '', agreeToTerms: false });
    const [idDoc, setIdDoc] = useState<File | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleNext = () => {
        if (step === 1 && !isPasswordStrong(formData.password).all) { setError("Password doesn't meet requirements."); return; }
        setError('');
        setStep(step + 1);
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!idDoc) { setError("Please upload your Proof of Identity."); return; }
        if (!formData.agreeToTerms) { setError("You must agree to the Investor Terms & Conditions."); return; }

        try {
            const { data, error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName,
                        role: 'investor',
                        phone: formData.phone,
                        investment_type: formData.investmentType,
                        company_name: formData.companyName,
                    }
                }
            });
            if (error) throw error;
            
            if (data.user && data.user.identities && data.user.identities.length === 0) {
                 setError('This email is already in use. Please log in.');
                 setStep(1);
                 return;
            }

            onSignupSuccess(); 
        } catch (error: any) {
            console.error("Supabase Investor Signup Error", error);
            setError(error.message || "Failed to sign up.");
            setStep(1);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-4">
                        <InputField label="Full Name" name="fullName" value={formData.fullName} onChange={handleInputChange} />
                        <InputField label="Email Address" name="email" type="email" value={formData.email} onChange={handleInputChange} />
                        <InputField label="Password" name="password" type="password" value={formData.password} onChange={handleInputChange} />
                        <PasswordStrengthMeter criteria={isPasswordStrong(formData.password)} />
                        <div className="flex justify-end"><button type="button" onClick={handleNext} className="btn-primary w-auto">Next</button></div>
                    </div>
                );
            case 2:
                return (
                     <div className="space-y-4">
                        <InputField label="Phone Number" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} />
                        <div><label className="block text-sm font-medium dark:text-slate-300">Investment Type</label><select name="investmentType" value={formData.investmentType} onChange={handleInputChange} className="w-full input-base mt-1"><option>Individual</option><option>Corporate</option></select></div>
                        {formData.investmentType === 'Corporate' && <InputField label="Company Name" name="companyName" value={formData.companyName} onChange={handleInputChange} />}
                        <div className="flex justify-between"><button type="button" onClick={() => setStep(1)} className="btn-secondary w-auto">Back</button><button type="button" onClick={() => setStep(3)} className="btn-primary w-auto">Next</button></div>
                    </div>
                );
            case 3:
                return (
                     <div className="space-y-4">
                        <FileInput label="Proof of Identity (ID/Passport)" file={idDoc} onFileChange={setIdDoc} acceptedTypes=".pdf,.jpg,.png" required />
                        <Checkbox id="agreeToTerms" name="agreeToTerms" checked={formData.agreeToTerms} onChange={handleInputChange}>I agree to the <a href="#" target="_blank" className="font-semibold text-brand-primary hover:underline">Investor Terms & Conditions</a>.</Checkbox>
                        <div className="flex justify-between"><button type="button" onClick={() => setStep(2)} className="btn-secondary w-auto">Back</button><button type="submit" className="btn-primary w-auto" disabled={!formData.agreeToTerms}>Submit Application</button></div>
                    </div>
                );
        }
    }

    return (
        <form onSubmit={handleSignup} className="max-h-[60vh] overflow-y-auto pr-2">
            <ProgressBar currentStep={step} totalSteps={3} />
            <div key={step} className="animate-fade-in mt-6">
                {renderStep()}
            </div>
            <p className="text-center text-sm mt-6 text-slate-500 dark:text-slate-400">Already have an account? <button type="button" onClick={onSwitchToLogin} className="font-semibold text-brand-primary hover:underline">Log In</button></p>
        </form>
    );
};

const PendingVerificationView: React.FC<{ onSwitchToLogin: () => void, userType: 'agent' | 'investor' }> = ({ onSwitchToLogin, userType }) => (
    <div className="text-center space-y-4 animate-fade-in">
        <CheckBadgeIcon className="w-16 h-16 text-green-500 mx-auto" />
        <p className="text-slate-600 dark:text-slate-300">Thank you for registering as an {userType}! Your application is now under review. We will notify you via email once your account has been approved. This typically takes 1-2 business days.</p>
        <button onClick={onSwitchToLogin} className="w-full btn-primary">Back to Login</button>
    </div>
);

const ConfirmEmailView: React.FC<{ onSwitchToLogin: () => void }> = ({ onSwitchToLogin }) => (
    <div className="space-y-4 text-center animate-fade-in">
        <div className="glass-card p-4 inline-block rounded-full mb-2 bg-green-50 dark:bg-green-900/20">
             <CheckBadgeIcon className="w-12 h-12 text-green-500" />
        </div>
        <h3 className="text-xl font-bold dark:text-white">Check Your Email</h3>
        <p className="text-slate-600 dark:text-slate-300">We've sent a confirmation link to your email address. Please click the link to verify your account before logging in.</p>
        <button onClick={onSwitchToLogin} className="w-full btn-primary mt-4">Go to Login</button>
    </div>
);

const ForgotPasswordView: React.FC<{ onResetSent: () => void, onBackToLogin: () => void, setError: (e: string) => void }> = ({ onResetSent, onBackToLogin, setError }) => {
    const [email, setEmail] = useState('');
    
    const handleReset = async (e: React.FormEvent) => { 
        e.preventDefault(); 
        setError('');
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
              redirectTo: window.location.origin + '?reset=true',
            });
            if (error) throw error;
            onResetSent(); 
        } catch (error: any) {
            console.error("Supabase Password Reset Error", error);
            setError(error.message || "Failed to send reset link.");
        }
    };

    return (
        <div className="space-y-4 animate-fade-in">
            <p className="text-sm text-slate-500 dark:text-slate-400">Enter your email and we'll send a link to reset your password.</p>
            <form onSubmit={handleReset} className="space-y-4">
                <InputField label="Email Address" id="reset-email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                <button type="submit" className="w-full btn-primary">Send Reset Link</button>
            </form>
            <p className="text-center"><button onClick={onBackToLogin} className="text-sm font-semibold text-brand-primary hover:underline">&larr; Back to Login</button></p>
        </div>
    );
};

const ResetConfirmationView: React.FC<{ onSwitchToLogin: () => void }> = ({ onSwitchToLogin }) => (
    <div className="space-y-4 text-center animate-fade-in">
        <p className="text-slate-600 dark:text-slate-300">If an account with that email exists, a password reset link has been sent. Please check your inbox.</p>
        <button onClick={onSwitchToLogin} className="font-semibold text-brand-primary hover:underline">&larr; Back to Login</button>
    </div>
);

// Main AuthModal component
export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin, initialView, onSwitchToPricing, onSuperAdminLogin }) => {
    const [view, setView] = useState<AuthView>(initialView || 'login');
    const [error, setError] = useState('');
    
    const handleLoginSuccess = () => {
        onLogin();
    };
    
    const switchView = (targetView: AuthView) => {
        setError('');
        setView(targetView);
    };
    
    useEffect(() => {
        if(isOpen) {
            setView(initialView || 'login');
            setError('');
        }
    }, [isOpen, initialView]);

    if (!isOpen) return null;
    
    const titles: Record<AuthView, string> = {
        login: 'Welcome Back',
        signup: 'Join AfriEstate',
        userSignup: 'Create Your Account',
        agentSignup: 'Agent & Agency Registration',
        investorSignup: 'Investor Registration',
        pendingVerificationAgent: 'Application Received',
        pendingVerificationInvestor: 'Application Received',
        forgotPassword: 'Reset Your Password',
        resetConfirmation: 'Check Your Email',
        confirmEmail: 'Check Your Email'
    };
    
    const currentTitle = titles[view] || 'Welcome';

    const handleSignupRole = (role: 'user' | 'agent' | 'investor') => {
        setError('');
        if (role === 'user') switchView('userSignup');
        if (role === 'agent') switchView('agentSignup');
        if (role === 'investor') switchView('investorSignup');
    };

  return (
    <div className="fixed inset-0 bg-brand-dark/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 sm:p-6 animate-fade-in" onClick={onClose}>
        <div 
            className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl flex overflow-hidden transform transition-all duration-500 opacity-0 animate-fade-in-scale relative" 
            onClick={e => e.stopPropagation()}
        >
            <div className="hidden lg:block lg:w-1/2 relative bg-brand-dark overflow-hidden group">
                <img src="https://www.propertycoza.com/wp-content/uploads/2022/11/Real-Estate-Agent-1920-x-1357-1-1536x736.png" alt="Luxury Estate" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-110 group-hover:opacity-80 transition-all duration-1000 ease-in-out"  referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/40 to-transparent pointer-events-none"></div>
                <div className="absolute inset-0 bg-brand-primary mix-blend-color opacity-20 group-hover:opacity-0 transition-opacity duration-1000"></div>
                <div className="absolute bottom-12 left-12 right-12 text-white transform group-hover:-translate-y-2 transition-transform duration-700">
                   <div className="w-12 h-1 bg-brand-secondary mb-6 transform origin-left group-hover:scale-x-150 transition-transform duration-500"></div>
                   <h3 className="text-4xl font-heading font-black mb-4 drop-shadow-lg leading-tight">Unlock Africa's<br/><span className="text-brand-secondary">Potential</span></h3>
                   <p className="text-slate-200 font-light drop-shadow-md text-lg leading-relaxed">Join the continent's most exclusive real estate network. Buy, sell, or invest with unprecedented clarity.</p>
                </div>
            </div>
            
            <div className="w-full lg:w-1/2 flex flex-col max-h-[85vh]">
                <header className="flex justify-between items-center p-8 sm:px-12 sm:pt-12 pb-4">
                    <h2 className="text-3xl font-heading font-black text-brand-dark">
                        {currentTitle}
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:text-brand-dark hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </header>
                
                <div className="px-8 pb-8 sm:px-12 sm:pb-12 overflow-y-auto flex-1 custom-scrollbar">
                    {error && <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded shadow-sm mb-6 text-sm flex items-center gap-3 animate-fade-in" role="alert"><svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg> <span>{error}</span></div>}

                {view === 'login' && <LoginView onLoginSuccess={handleLoginSuccess} onSwitchToSignup={() => switchView('signup')} onSwitchToForgotPassword={() => switchView('forgotPassword')} setError={setError} onSuperAdminLogin={onSuperAdminLogin} />}
                {view === 'signup' && <SignupView onSwitchToLogin={() => switchView('login')} onSignupRole={handleSignupRole} />}
                {view === 'userSignup' && <UserSignupView onSignupSuccess={handleLoginSuccess} onRequireEmailConfirmation={() => switchView('confirmEmail')} onSwitchToLogin={() => switchView('login')} setError={setError} />}
                {view === 'agentSignup' && <AgentSignupView onSignupSuccess={() => switchView('pendingVerificationAgent')} onSwitchToLogin={() => switchView('login')} setError={setError} />}
                {view === 'investorSignup' && <InvestorSignupView onSignupSuccess={() => switchView('pendingVerificationInvestor')} onSwitchToLogin={() => switchView('login')} setError={setError} />}
                {view === 'pendingVerificationAgent' && <PendingVerificationView onSwitchToLogin={() => switchView('login')} userType="agent" />}
                {view === 'pendingVerificationInvestor' && <PendingVerificationView onSwitchToLogin={() => switchView('login')} userType="investor" />}
                {view === 'forgotPassword' && <ForgotPasswordView onResetSent={() => switchView('resetConfirmation')} onBackToLogin={() => switchView('login')} setError={setError} />}
                {view === 'resetConfirmation' && <ResetConfirmationView onSwitchToLogin={() => switchView('login')} />}
                {view === 'confirmEmail' && <ConfirmEmailView onSwitchToLogin={() => switchView('login')} />}
                </div>
            </div>
        </div>
        <style>{`
            @keyframes fadeIn { from { opacity: 0; backdrop-filter: blur(0px); } to { opacity: 1; backdrop-filter: blur(8px); } }
            @keyframes fadeInScale { from { opacity: 0; transform: scale(0.98) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
            .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
            .animate-fade-in-scale { animation: fadeInScale 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            
            .input-base {
                @apply w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl focus:bg-white focus:ring-0 focus:border-brand-primary text-brand-dark transition-all duration-300 placeholder:text-slate-400;
            }
            
            .input-base:focus {
                box-shadow: 0 4px 20px -5px rgba(15, 45, 37, 0.1);
            }
            
            .btn-primary {
                @apply w-full bg-brand-primary text-white px-5 py-4 rounded-xl font-bold tracking-wide hover:bg-brand-dark transition-all duration-300 disabled:bg-slate-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl active:translate-y-0 active:shadow-md;
            }
            .btn-secondary {
                @apply bg-brand-light text-brand-dark px-5 py-4 rounded-xl font-bold hover:bg-slate-200 transition-all duration-300;
            }
            
            .custom-scrollbar::-webkit-scrollbar {
                width: 6px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
                background: transparent;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
                background-color: #e2e8f0;
                border-radius: 20px;
            }
            .custom-scrollbar:hover::-webkit-scrollbar-thumb {
                background-color: #cbd5e1;
            }
        `}</style>
    </div>
  );
};