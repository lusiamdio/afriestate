import React, { useState, useRef, useEffect, useMemo } from 'react';
import { FacebookIcon, TwitterIcon, InstagramIcon } from './icons/SocialIcons';
import { useTranslations } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { currencyOptions, languageOptions } from '../constants';
import { Currency, Language } from '../types';
import {
  ArrowUpIcon,
  CheckIcon,
  ClipboardDocumentIcon,
  GlobeAltIcon,
  ChevronDownIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

interface FooterProps {
  onAboutClick: () => void;
  onContactClick: () => void;
  onBlogClick: () => void;
  onPrivacyPolicyClick: () => void;
  onTermsOfServiceClick: () => void;
  onCareersClick: () => void;
  onFindAProClick: () => void;
  onMarketJump?: (location: string) => void;
  onModeJump?: (mode: 'buy' | 'rent' | 'invest') => void;
}

const FOOTER_HUBS = [
  { city: 'Cape Town', country: 'South Africa' },
  { city: 'Johannesburg', country: 'South Africa' },
  { city: 'Lagos', country: 'Nigeria' },
  { city: 'Nairobi', country: 'Kenya' },
  { city: 'Accra', country: 'Ghana' },
  { city: 'Kigali', country: 'Rwanda' },
  { city: 'Cairo', country: 'Egypt' },
  { city: 'Casablanca', country: 'Morocco' },
];

const DIGEST_TOPICS = ['Market Reports', 'Luxury Listings', 'High-Yield Deals'];

const Footer: React.FC<FooterProps> = ({
  onAboutClick,
  onContactClick,
  onBlogClick,
  onPrivacyPolicyClick,
  onTermsOfServiceClick,
  onCareersClick,
  onFindAProClick,
  onMarketJump,
  onModeJump,
}) => {
  const { t, language, setLanguage } = useTranslations();
  const { currency, setCurrency } = useCurrency();

  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');
  const currencyRef = useRef<HTMLDivElement>(null);

  const [email, setEmail] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>(['Market Reports']);
  const [subscribedMessage, setSubscribedMessage] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<'email' | 'phone' | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (currencyRef.current && !currencyRef.current.contains(event.target as Node)) {
        setIsCurrencyOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCurrencies = useMemo(() => {
    const q = currencySearch.trim().toLowerCase();
    return Object.entries(currencyOptions).filter(([code, details]) => {
      if (!q) return true;
      return (
        code.toLowerCase().includes(q) ||
        details.name.toLowerCase().includes(q) ||
        details.symbol.toLowerCase().includes(q)
      );
    });
  }, [currencySearch]);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, handler: () => void) => {
    e.preventDefault();
    handler();
  };

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((item) => item !== topic) : [...prev, topic]
    );
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = email.trim();
    if (!cleaned || !cleaned.includes('@')) return;
    const topicsSummary = selectedTopics.length > 0 ? selectedTopics.join(', ') : 'Weekly Digest';
    setSubscribedMessage(`Subscribed ${cleaned} to ${topicsSummary}.`);
    setEmail('');
  };

  const handleCopy = async (value: string, field: 'email' | 'phone') => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Fallback if clipboard blocked in sandbox
    }
    setCopiedField(field);
    window.setTimeout(() => setCopiedField(null), 2000);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#0B1F1A] text-slate-300">
      {/* Top Interactive Continental Hub Strip */}
      <div className="bg-[#081713]">
        <div className="w-full px-4 sm:px-6 lg:px-10 py-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 uppercase tracking-wider shrink-0">
            <MapPinIcon className="w-4 h-4 shrink-0" />
            <span>Jump to Active Markets</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {FOOTER_HUBS.map((hub) => (
              <button
                key={hub.city}
                type="button"
                onClick={() => {
                  if (onMarketJump) {
                    onMarketJump(hub.city);
                  } else {
                    scrollToTop();
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-amber-400 hover:text-slate-950 text-xs font-medium text-slate-200 transition-colors whitespace-nowrap"
              >
                {hub.city} · {hub.country}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer Grid */}
      <div className="w-full px-4 sm:px-6 lg:px-10 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
          {/* Column 1: Brand & Quick Desk Contacts */}
          <div className="lg:col-span-4 space-y-5">
            <div>
              <button
                type="button"
                onClick={scrollToTop}
                className="text-2xl font-bold text-white font-heading tracking-tight hover:text-amber-300 transition-colors"
              >
                AfriEstate
              </button>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed max-w-sm">
                {t.footer.tagline}
              </p>
            </div>

            {/* Interactive Copyable Concierge Channels */}
            <div className="space-y-2 pt-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Concierge Desk
              </p>
              <div className="flex flex-col gap-2 max-w-xs">
                <button
                  type="button"
                  onClick={() => handleCopy('concierge@afriestate.co.za', 'email')}
                  className="flex items-center justify-between px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-200 transition-colors"
                >
                  <span className="truncate">concierge@afriestate.co.za</span>
                  <span className="inline-flex items-center gap-1 text-amber-300 font-semibold ml-2 shrink-0">
                    {copiedField === 'email' ? (
                      <>
                        <CheckIcon className="w-3.5 h-3.5" />
                        Copied
                      </>
                    ) : (
                      <>
                        <ClipboardDocumentIcon className="w-3.5 h-3.5" />
                        Copy
                      </>
                    )}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy('+27 21 555 0100', 'phone')}
                  className="flex items-center justify-between px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-200 font-mono tabular-nums transition-colors"
                >
                  <span>+27 21 555 0100</span>
                  <span className="inline-flex items-center gap-1 text-amber-300 font-sans font-semibold ml-2 shrink-0">
                    {copiedField === 'phone' ? (
                      <>
                        <CheckIcon className="w-3.5 h-3.5" />
                        Copied
                      </>
                    ) : (
                      <>
                        <ClipboardDocumentIcon className="w-3.5 h-3.5" />
                        Copy
                      </>
                    )}
                  </span>
                </button>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-4 pt-2">
              <a
                href="https://www.facebook.com/afriestate"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <FacebookIcon className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <TwitterIcon className="w-4 h-4" />
              </a>
              <a
                href="https://www.instagram.com/afriestate"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <InstagramIcon className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Explore & Platform Links */}
          <div className="lg:col-span-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              {t.footer.quickLinks}
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="#about" onClick={(e) => handleLinkClick(e, onAboutClick)} className="text-slate-300 hover:text-amber-300 transition-colors">
                  {t.footer.aboutUs}
                </a>
              </li>
              <li>
                <a href="#contact" onClick={(e) => handleLinkClick(e, onContactClick)} className="text-slate-300 hover:text-amber-300 transition-colors">
                  {t.footer.contact}
                </a>
              </li>
              <li>
                <a href="#careers" onClick={(e) => handleLinkClick(e, onCareersClick)} className="text-slate-300 hover:text-amber-300 transition-colors">
                  {t.footer.careers}
                </a>
              </li>
              <li>
                <a href="#blog" onClick={(e) => handleLinkClick(e, onBlogClick)} className="text-slate-300 hover:text-amber-300 transition-colors">
                  {t.footer.blog}
                </a>
              </li>
              <li>
                <a href="#find-pro" onClick={(e) => handleLinkClick(e, onFindAProClick)} className="text-slate-300 hover:text-amber-300 transition-colors">
                  {t.footer.findAPro}
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Browse by Intent & Legal */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
                Marketplace Modes
              </h3>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <button
                    type="button"
                    onClick={() => onModeJump?.('buy')}
                    className="text-slate-300 hover:text-amber-300 transition-colors font-normal"
                  >
                    Buy Residential & Estates
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onModeJump?.('rent')}
                    className="text-slate-300 hover:text-amber-300 transition-colors font-normal"
                  >
                    Verified Long-Term Rentals
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onModeJump?.('invest')}
                    className="text-slate-300 hover:text-amber-300 transition-colors font-normal"
                  >
                    REITs & Co-Investments
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white mb-3">
                {t.footer.legal}
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#privacy" onClick={(e) => handleLinkClick(e, onPrivacyPolicyClick)} className="text-slate-400 hover:text-white transition-colors">
                    {t.footer.privacyPolicy}
                  </a>
                </li>
                <li>
                  <a href="#terms" onClick={(e) => handleLinkClick(e, onTermsOfServiceClick)} className="text-slate-400 hover:text-white transition-colors">
                    {t.footer.termsOfService}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Column 4: Searchable Currency, Language & Market Digest */}
          <div className="lg:col-span-4 space-y-6">
            {/* Regional Preferences Card */}
            <div className="p-5 rounded-2xl bg-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-white flex items-center gap-1.5">
                  <GlobeAltIcon className="w-4 h-4 text-amber-300" />
                  Currency & Language
                </span>
              </div>

              {/* Searchable Currency Dropdown */}
              <div className="relative" ref={currencyRef}>
                <button
                  type="button"
                  onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                  className="w-full bg-[#081713] hover:bg-slate-900 border-0 text-left px-3.5 py-2.5 rounded-xl flex justify-between items-center text-xs font-medium text-white transition-colors"
                >
                  <span className="truncate">
                    {currencyOptions[currency].symbol} · {currencyOptions[currency].name} ({currency})
                  </span>
                  <ChevronDownIcon className={`w-4 h-4 text-slate-400 transition-transform ${isCurrencyOpen ? 'rotate-180' : ''}`} />
                </button>

                {isCurrencyOpen && (
                  <div className="absolute bottom-full mb-2 w-full bg-slate-900 rounded-xl shadow-2xl z-30 overflow-hidden">
                    <div className="p-2 bg-slate-950/60">
                      <input
                        type="text"
                        value={currencySearch}
                        onChange={(e) => setCurrencySearch(e.target.value)}
                        placeholder="Filter currencies (ZAR, NGN, KES...)"
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border-0 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                    <div className="max-h-52 overflow-y-auto py-1">
                      {filteredCurrencies.map(([code, details]) => (
                        <button
                          key={code}
                          type="button"
                          onClick={() => {
                            setCurrency(code as Currency);
                            setIsCurrencyOpen(false);
                            setCurrencySearch('');
                          }}
                          className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-colors ${
                            currency === code
                              ? 'bg-emerald-900/60 text-amber-300 font-semibold'
                              : 'text-slate-200 hover:bg-slate-800'
                          }`}
                        >
                          <span>{details.symbol} · {details.name}</span>
                          <span className="font-mono text-[11px] text-slate-400">{code}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Language Quick Buttons */}
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(languageOptions).map(([langCode, details]) => (
                  <button
                    key={langCode}
                    type="button"
                    onClick={() => setLanguage(langCode as Language)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap inline-flex items-center gap-1.5 ${
                      language === langCode
                        ? 'bg-amber-400 text-slate-950 font-semibold'
                        : 'bg-[#081713] text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <span className="font-mono text-[10px] opacity-75">{details.flag}</span>
                    <span>{details.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Market Digest Newsletter */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white mb-1.5">
                Stay Updated · Continental Digest
              </h3>
              <p className="text-xs text-slate-400 mb-3">
                Choose the briefings you want delivered weekly.
              </p>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {DIGEST_TOPICS.map((topic) => {
                  const active = selectedTopics.includes(topic);
                  return (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => toggleTopic(topic)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap inline-flex items-center gap-1 ${
                        active
                          ? 'bg-emerald-900 text-emerald-200'
                          : 'bg-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      {active ? <CheckIcon className="w-3 h-3 shrink-0" /> : <span>+</span>}
                      <span>{topic}</span>
                    </button>
                  );
                })}
              </div>

              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (subscribedMessage) setSubscribedMessage(null);
                  }}
                  placeholder="Enter your email address"
                  required
                  aria-label="Email for newsletter"
                  className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl bg-[#081713] border-0 text-white placeholder:text-slate-500 text-xs focus:ring-1 focus:ring-amber-400 outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-xs transition-colors whitespace-nowrap shrink-0"
                >
                  Subscribe
                </button>
              </form>

              {subscribedMessage && (
                <p className="mt-2.5 text-xs text-emerald-300 font-medium flex items-center gap-1.5">
                  <CheckIcon className="w-4 h-4 shrink-0" />
                  <span>{subscribedMessage}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Back-to-Top Row */}
        <div className="mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>{t.footer.copyright.replace('{{year}}', String(new Date().getFullYear()))}</p>
          <button
            type="button"
            onClick={scrollToTop}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 transition-colors"
          >
            <span>Back to Top</span>
            <ArrowUpIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;