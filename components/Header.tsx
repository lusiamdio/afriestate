import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GlobeAltIcon } from './icons/NavIcons';
import { BellIcon, UserCircleIcon, CheckBadgeIcon, BanknotesIcon, HeartIcon } from './icons/ActionIcons';
import type { User, Notification } from '../types';
import { Language, Currency } from '../types';
import { useTranslations } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { languageOptions, currencyOptions } from '../constants';
import { Bars3Icon, XMarkIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import NotificationsPanel from './NotificationsPanel';
import { useAdminState } from '../contexts/AdminStateContext';

interface HeaderProps {
  currentUser: User | null;
  notifications: Notification[];
  readNotificationIds: Set<string>;
  onLoginClick: () => void;
  onSignUpClick: () => void;
  onDashboardClick: () => void;
  onListPropertyClick: () => void;
  onNotificationClick: (notification: Notification) => void;
  onMarkAllNotificationsAsRead: () => void;
  onHomeClick: () => void;
  onAboutClick: () => void;
  onServicesClick: () => void;
  onContactClick: () => void;
  onBuyClick?: () => void;
  onRentClick?: () => void;
  onStayClick?: () => void;
  onLongTermClick?: () => void;
  onTransportClick?: () => void;
  onWellnessClick?: () => void;
  onInvestClick?: () => void;
  onSellClick?: () => void;
  onDevelopClick?: () => void;
  onExploreClick?: () => void;
  onNeighborhoodsClick?: () => void;
  onFindProClick?: () => void;
  onHotelRegisterClick?: () => void;
  onPricingClick?: () => void;
  savedCount?: number;
  onSavedClick?: () => void;
  onMessagesClick?: () => void;
}

const Header: React.FC<HeaderProps> = (props) => {
  const { 
    currentUser, 
    notifications, 
    onLoginClick, 
    onSignUpClick, 
    onDashboardClick, 
    onListPropertyClick, 
    onNotificationClick, 
    onMarkAllNotificationsAsRead, 
    onHomeClick, 
    onAboutClick, 
    onServicesClick, 
    onContactClick,
    onBuyClick,
    onRentClick,
    onStayClick,
    onLongTermClick,
    onTransportClick,
    onWellnessClick,
    onInvestClick,
    onSellClick,
    onDevelopClick,
    onExploreClick,
    onNeighborhoodsClick,
    onFindProClick,
    onHotelRegisterClick,
    onPricingClick,
    savedCount = 0,
    onSavedClick,
    onMessagesClick
  } = props;

  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  const langRef = useRef<HTMLDivElement>(null);
  const currencyRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const { language, setLanguage, t, isTranslating } = useTranslations();
  const { currency, setCurrency } = useCurrency();
  const { settings } = useAdminState();
  const flags = settings.featureFlags;
  const brandTitle = (settings.siteName || 'AfriEstate').toUpperCase();

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(event.target as Node)) setIsLangOpen(false);
      if (currencyRef.current && !currencyRef.current.contains(event.target as Node)) setIsCurrencyOpen(false);
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) setIsNotificationsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getButtonText = () => {
    if (!currentUser) return 'List Property';
    switch (currentUser.role) {
      case 'investor':
        return 'Investment Desk';
      case 'user':
        return 'List Property';
      case 'agent':
      default:
        return 'List Property';
    }
  };

  const handleNotificationItemClick = (notification: Notification) => {
    onNotificationClick(notification);
    setIsNotificationsOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xs transition-colors">
      <div className="w-full px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Single Text Element Brand Wordmark */}
        <button 
          onClick={onHomeClick} 
          className="flex items-center gap-2 shrink-0 group focus:outline-none"
        >
          <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight whitespace-nowrap">
            {brandTitle}
          </span>
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest hidden sm:inline">
            Africa
          </span>
        </button>

        {/* Zone 2: Synchronized Platform Navigation Links */}
        <nav className="hidden lg:flex items-center gap-4 xl:gap-5 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <button 
            type="button"
            onClick={onBuyClick || onHomeClick}
            className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap"
          >
            Buy
          </button>
          <button 
            type="button"
            onClick={onRentClick || onHomeClick}
            className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap"
          >
            Rent
          </button>
          {flags.shortStays && (
            <button 
              type="button"
              onClick={onStayClick || onHomeClick}
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap"
            >
              Short Stays
            </button>
          )}
          {flags.longTerm && (
            <button 
              type="button"
              onClick={onLongTermClick || onStayClick || onRentClick}
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap"
            >
              Long-Term
            </button>
          )}
          {flags.transport && (
            <button 
              type="button"
              onClick={onTransportClick || onServicesClick}
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap"
            >
              Transport
            </button>
          )}
          {flags.wellness && (
            <button 
              type="button"
              onClick={onWellnessClick || onServicesClick}
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap"
            >
              Wellness
            </button>
          )}
          <button 
            type="button"
            onClick={onInvestClick || onHomeClick}
            className="text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 font-bold transition-colors whitespace-nowrap"
          >
            Invest
          </button>
          {flags.neighborhoods && (
            <button 
              type="button"
              onClick={onNeighborhoodsClick || onExploreClick || onHomeClick}
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap hidden xl:inline"
            >
              Neighborhoods
            </button>
          )}
          {flags.hotelRegistration && (
            <button 
              type="button"
              onClick={onHotelRegisterClick || onSellClick || onListPropertyClick}
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap hidden xl:inline"
            >
              List Hotel
            </button>
          )}
        </nav>

        {/* Zone 3: Right Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Currency Selector (Local + Selected Preferred Currency) */}
          <div className="relative" ref={currencyRef}>
            <button 
              onClick={() => setIsCurrencyOpen(!isCurrencyOpen)} 
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs font-semibold"
              title="Change Currency"
            >
              <BanknotesIcon className="w-4 h-4 text-slate-500" />
              <span>{currencyOptions[currency].symbol}</span>
            </button>
            {isCurrencyOpen && (
              <div className="absolute top-full right-0 mt-2 w-52 max-h-64 overflow-y-auto bg-white dark:bg-slate-900 rounded-xl shadow-xl py-1 z-50">
                <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider bg-slate-50 dark:bg-slate-800/60">
                  Select Preferred Currency
                </div>
                {Object.entries(currencyOptions).map(([code, details]) => (
                  <button 
                    key={code}
                    onClick={() => {
                      setCurrency(code as Currency);
                      setIsCurrencyOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between"
                  >
                    <span>{details.symbol} {details.name}</span>
                    {currency === code && <CheckBadgeIcon className="w-4 h-4 text-emerald-600"/>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Language Selector */}
          <div className="relative" ref={langRef}>
            <button 
              onClick={() => setIsLangOpen(!isLangOpen)} 
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs"
              title="Change Language"
            >
              <GlobeAltIcon className="w-4 h-4 text-slate-500" />
              {isTranslating ? (
                <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span className="text-[11px] font-mono font-semibold uppercase hidden sm:inline">{languageOptions[language].flag}</span>
              )}
            </button>
            {isLangOpen && (
              <div className="absolute top-full right-0 mt-2 w-44 bg-white dark:bg-slate-900 rounded-xl shadow-xl py-1 z-50">
                {Object.entries(languageOptions).map(([langCode, langDetails]) => (
                  <button 
                    key={langCode}
                    onClick={() => {
                      setLanguage(langCode as Language);
                      setIsLangOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {langDetails.flag}
                      </span>
                      <span>{langDetails.name}</span>
                    </span>
                    {language === langCode && <CheckBadgeIcon className="w-4 h-4 text-emerald-600"/>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Saved Properties Link / Button */}
          {onSavedClick && (
            <button
              type="button"
              onClick={onSavedClick}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
              title="My Saved Properties"
            >
              <HeartIcon className="w-5 h-5" />
              {savedCount > 0 && (
                <span className="absolute top-0.5 right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-white text-[9px] font-bold">
                  {savedCount}
                </span>
              )}
            </button>
          )}

          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setIsNotificationsOpen(prev => !prev)}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
              title="Notifications"
            >
              <BellIcon className="w-5 h-5" />
              {currentUser && unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
            {isNotificationsOpen && currentUser && (
              <NotificationsPanel 
                notifications={notifications} 
                onNotificationClick={handleNotificationItemClick}
                onMarkAllAsRead={onMarkAllNotificationsAsRead}
              />
            )}
          </div>

          {/* User Account / Profile */}
          {currentUser ? (
            <button 
              onClick={onDashboardClick} 
              className="p-1 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
              title="User Dashboard"
            >
              <UserCircleIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
              <span className="text-xs font-semibold hidden md:inline truncate max-w-[100px]">
                {currentUser.fullName || currentUser.username}
              </span>
            </button>
          ) : (
            <button 
              onClick={onLoginClick} 
              className="text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 transition-colors hidden sm:block whitespace-nowrap"
            >
              Sign In
            </button>
          )}

          {/* Primary CTA: List Property */}
          <button 
            onClick={currentUser ? onListPropertyClick : onSignUpClick} 
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-xs font-semibold rounded-xl transition shadow-sm whitespace-nowrap"
          >
            {getButtonText()}
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          >
            {isMobileMenuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile & Tablet Synchronized Dropdown Navigation */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white dark:bg-slate-900 shadow-lg px-4 py-4 space-y-3 border-t border-slate-100 dark:border-slate-800">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pb-3">
            <button
              onClick={() => { onBuyClick?.(); setIsMobileMenuOpen(false); }}
              className="p-2 text-center rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold"
            >
              Buy
            </button>
            <button
              onClick={() => { onRentClick?.(); setIsMobileMenuOpen(false); }}
              className="p-2 text-center rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold"
            >
              Rent
            </button>
            {flags.shortStays && (
              <button
                onClick={() => { onStayClick?.(); setIsMobileMenuOpen(false); }}
                className="p-2 text-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold"
              >
                Short Stays
              </button>
            )}
            {flags.longTerm && (
              <button
                onClick={() => { (onLongTermClick || onStayClick)?.(); setIsMobileMenuOpen(false); }}
                className="p-2 text-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold"
              >
                Long-Term
              </button>
            )}
            {flags.transport && (
              <button
                onClick={() => { (onTransportClick || onServicesClick)?.(); setIsMobileMenuOpen(false); }}
                className="p-2 text-center rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              >
                Transport
              </button>
            )}
            {flags.wellness && (
              <button
                onClick={() => { (onWellnessClick || onServicesClick)?.(); setIsMobileMenuOpen(false); }}
                className="p-2 text-center rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 text-xs font-bold"
              >
                Wellness
              </button>
            )}
          </div>

          <nav className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm font-medium">
            <button
              onClick={() => { onInvestClick?.(); setIsMobileMenuOpen(false); }}
              className="block w-full text-left py-1.5 text-amber-700 dark:text-amber-400 font-semibold"
            >
              Invest &amp; High-Yield Deals
            </button>
            {flags.neighborhoods && (
              <button
                onClick={() => { (onNeighborhoodsClick || onExploreClick)?.(); setIsMobileMenuOpen(false); }}
                className="block w-full text-left py-1.5 text-slate-700 dark:text-slate-200"
              >
                Neighborhood Explorer
              </button>
            )}
            {flags.professionals && (
              <button
                onClick={() => { (onFindProClick || onServicesClick)?.(); setIsMobileMenuOpen(false); }}
                className="block w-full text-left py-1.5 text-slate-700 dark:text-slate-200"
              >
                Find a Professional
              </button>
            )}
            {flags.hotelRegistration && (
              <button
                onClick={() => { (onHotelRegisterClick || onSellClick)?.(); setIsMobileMenuOpen(false); }}
                className="block w-full text-left py-1.5 text-slate-700 dark:text-slate-200"
              >
                List Your Hotel
              </button>
            )}
            <button
              onClick={() => { (onPricingClick || onSignUpClick)?.(); setIsMobileMenuOpen(false); }}
              className="block w-full text-left py-1.5 text-slate-700 dark:text-slate-200"
            >
              Pricing &amp; Plans
            </button>
            <button
              onClick={() => { onServicesClick(); setIsMobileMenuOpen(false); }}
              className="block w-full text-left py-1.5 text-slate-700 dark:text-slate-200"
            >
              Platform Services
            </button>
            <button
              onClick={() => { onAboutClick(); setIsMobileMenuOpen(false); }}
              className="block w-full text-left py-1.5 text-slate-700 dark:text-slate-200"
            >
              About {settings.siteName || 'AfriEstate'}
            </button>
            <button
              onClick={() => { onContactClick(); setIsMobileMenuOpen(false); }}
              className="block w-full text-left py-1.5 text-slate-700 dark:text-slate-200"
            >
              Contact Desk
            </button>
          </nav>
          {!currentUser && (
            <button
              onClick={() => { onLoginClick(); setIsMobileMenuOpen(false); }}
              className="w-full mt-2 py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-center text-xs font-bold"
            >
              Sign In / Create Account
            </button>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;