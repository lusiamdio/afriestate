import React, { useState, useMemo, useEffect } from 'react';
import { GoogleGenAI, Type } from '../../../lib/ai';
import type { MarketHotspot, Property, ExclusiveDeal, MarketComparison } from '../../../types';
import { DealType } from '../../../types';
import { MarketplaceIcon, TagIcon, ScaleIcon } from '../../icons/InvestorDashboardIcons';
import { CpuChipIcon } from '../../icons/ActionIcons';
import { EXCLUSIVE_DEALS, ALL_PROPERTIES } from '../../../constants';
import { useCurrency } from '../../../contexts/CurrencyContext';

type MarketplaceTab = 'hotspots' | 'deals' | 'analysis';

interface InvestorGlobalMarketplaceProps {
  onOpenDetailModal: (property: Property) => void;
}

const comparisonSchema = {
  type: Type.OBJECT,
  properties: {
    country_a: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        summary: { type: Type.STRING },
        pros: { type: Type.ARRAY, items: { type: Type.STRING } },
        cons: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['name', 'summary', 'pros', 'cons'],
    },
    country_b: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        summary: { type: Type.STRING },
        pros: { type: Type.ARRAY, items: { type: Type.STRING } },
        cons: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['name', 'summary', 'pros', 'cons'],
    },
  },
};

const DEFAULT_HOTSPOTS: MarketHotspot[] = [
  {
    location: 'Cape Town Atlantic Seaboard, South Africa',
    risk_reward_profile: 'Core-Plus · 9.4% Est. Gross Yield',
    analysis: 'Sustained international semigration and constrained coastal land supply support high short-stay ADR and resilient ZAR/USD appreciation.',
  },
  {
    location: 'Kilimani & Westlands, Nairobi, Kenya',
    risk_reward_profile: 'Growth · 10.8% Est. Gross Yield',
    analysis: 'East African commercial hub expanding serviced apartment demand driven by multilateral organizations and regional tech offices.',
  },
  {
    location: 'Kigali Vision City Corridor, Rwanda',
    risk_reward_profile: 'Opportunistic · 11.2% Est. Gross Yield',
    analysis: 'Transparent land registry, fast municipal permitting, and rising conference hospitality occupancy anchor long-term institutional upside.',
  },
];

const InvestorGlobalMarketplace: React.FC<InvestorGlobalMarketplaceProps> = ({ onOpenDetailModal }) => {
  const [activeTab, setActiveTab] = useState<MarketplaceTab>('hotspots');

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Global Markets &amp; Syndicates
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Cross-border growth corridors, off-market allocations, and sovereign jurisdiction comparisons.
          </p>
        </div>

        <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg self-start sm:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('hotspots')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'hotspots'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <MarketplaceIcon className="w-4 h-4" /> AI Hotspots
          </button>
          <button
            onClick={() => setActiveTab('deals')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'deals'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TagIcon className="w-4 h-4" /> Exclusive Deals
          </button>
          <button
            onClick={() => setActiveTab('analysis')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'analysis'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ScaleIcon className="w-4 h-4" /> Cross-Border Comparison
          </button>
        </div>
      </div>

      {activeTab === 'hotspots' && <AIHotspots />}
      {activeTab === 'deals' && <ExclusiveDeals onOpenDetailModal={onOpenDetailModal} />}
      {activeTab === 'analysis' && <CrossBorderAnalysis />}
    </div>
  );
};

const AIHotspots: React.FC = () => {
  const [hotspots, setHotspots] = useState<MarketHotspot[]>(DEFAULT_HOTSPOTS);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateHotspots = async () => {
    setIsLoading(true);
    try {
      const ai = new GoogleGenAI();
      const prompt =
        'Analyze African and global prime real estate trends to identify 3 emerging property investment hotspots. For each, provide location, a concise risk_reward_profile, and brief analysis. Return JSON array.';
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                location: { type: Type.STRING },
                risk_reward_profile: { type: Type.STRING },
                analysis: { type: Type.STRING },
              },
              required: ['location', 'risk_reward_profile', 'analysis'],
            },
          },
        },
      });
      setHotspots(JSON.parse(response.text.trim()));
    } catch {
      setHotspots(DEFAULT_HOTSPOTS);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white font-sans">
            Emerging Yield Corridors
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            AI-synthesized capital growth and rental yield hotspots across target markets.
          </p>
        </div>
        <button
          onClick={handleGenerateHotspots}
          disabled={isLoading}
          className="px-4 py-2 text-xs font-semibold bg-[#0F2D25] text-white rounded-lg hover:bg-[#173f34] disabled:bg-slate-400 flex items-center gap-1.5 transition-colors self-start sm:self-auto whitespace-nowrap"
        >
          {isLoading ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <CpuChipIcon className="w-4 h-4 text-[#C9A35D]" />
          )}
          {isLoading ? 'Scanning Markets...' : 'Refresh Hotspots'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {hotspots.map((spot, index) => (
          <div
            key={index}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between"
          >
            <div>
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                {spot.risk_reward_profile}
              </p>
              <h4 className="font-semibold text-base text-slate-900 dark:text-white leading-snug">{spot.location}</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2.5 leading-relaxed">{spot.analysis}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ExclusiveDeals: React.FC<{ onOpenDetailModal: (property: Property) => void }> = ({ onOpenDetailModal }) => {
  const { formatCurrency } = useCurrency();
  const deals = useMemo(
    () =>
      EXCLUSIVE_DEALS.map((deal) => ({
        ...deal,
        property: ALL_PROPERTIES.find((p) => p.id === deal.propertyId),
      })).filter((d): d is { property: Property } & ExclusiveDeal => d.property !== undefined),
    []
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {deals.map((deal) => (
        <div
          key={deal.id}
          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between gap-4"
        >
          <div className="flex gap-4">
            <img
              src={deal.property.images[0]}
              alt={deal.property.title}
              className="w-28 h-28 object-cover rounded-lg flex-shrink-0 bg-slate-100 dark:bg-slate-800"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#C9A35D]">{deal.type}</p>
              <h4 className="font-semibold text-base text-slate-900 dark:text-white truncate mt-0.5">
                {deal.property.title}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{deal.property.address.city}</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-2">
                {formatCurrency(deal.property.price)}
              </p>
              {deal.type === DealType.AUCTION && deal.auctionEnds && <CountdownTimer endTime={deal.auctionEnds} />}
            </div>
          </div>
          <button
            onClick={() => onOpenDetailModal(deal.property)}
            className="w-full bg-[#0F2D25] text-white font-semibold py-2.5 rounded-lg hover:bg-[#173f34] text-xs transition-colors"
          >
            Inspect Deal Memo
          </button>
        </div>
      ))}
    </div>
  );
};

const CountdownTimer: React.FC<{ endTime: number }> = ({ endTime }) => {
  const calculateTimeLeft = () => {
    const diff = endTime - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / 1000 / 60) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  };
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [endTime]);

  return (
    <p className="mt-1.5 text-xs font-mono tabular-nums font-semibold text-red-600 dark:text-red-400">
      Closes in {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
    </p>
  );
};

const countryList = ['South Africa', 'Kenya', 'Rwanda', 'Mauritius', 'Portugal', 'United Arab Emirates'];

const CrossBorderAnalysis: React.FC = () => {
  const [countryA, setCountryA] = useState('South Africa');
  const [countryB, setCountryB] = useState('Mauritius');
  const [comparison, setComparison] = useState<MarketComparison | null>({
    country_a: {
      name: 'South Africa',
      summary: 'Deepest real estate liquidity on the continent with strong rental yields in coastal luxury and logistics hubs.',
      pros: ['Mature REIT & sectional title framework', 'Attractive USD entry valuation'],
      cons: ['Municipal utility variance', 'SARB exchange control procedures'],
    },
    country_b: {
      name: 'Mauritius',
      summary: 'Political stability, favorable 15% flat tax regime, and permanent residency linked to PDS resort acquisitions.',
      pros: ['No capital gains or inheritance tax', 'Residency eligibility above $375k'],
      cons: ['Higher entry price per square meter', 'Concentrated island market'],
    },
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleCompare = async () => {
    setIsLoading(true);
    try {
      const ai = new GoogleGenAI();
      const prompt = `Compare ${countryA} and ${countryB} for a cross-border real estate investor. Analyze market summary, 2 pros, and 2 cons for each. Return JSON.`;
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json', responseSchema: comparisonSchema },
      });
      setComparison(JSON.parse(response.text.trim()));
    } catch {
      setComparison({
        country_a: {
          name: countryA,
          summary: `${countryA} offers competitive acquisition multiples and strong urban rental absorption across prime metros.`,
          pros: ['Strong long-term urbanization demand', 'Established commercial legal corridors'],
          cons: ['Requires local tax & SPV structuring', 'Currency hedging considerations'],
        },
        country_b: {
          name: countryB,
          summary: `${countryB} presents steady cross-border capital inflows and specialized residency or corporate incentives.`,
          pros: ['Favorable investor holding structures', 'High-demand short-stay corridors'],
          cons: ['Competitive prime inventory pricing', 'Jurisdictional licensing timelines'],
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <select
          value={countryA}
          onChange={(e) => setCountryA(e.target.value)}
          className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
        >
          {countryList.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <span className="text-xs font-semibold text-slate-400 text-center">vs.</span>
        <select
          value={countryB}
          onChange={(e) => setCountryB(e.target.value)}
          className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
        >
          {countryList.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button
          onClick={handleCompare}
          disabled={isLoading}
          className="px-4 py-2.5 text-xs font-semibold bg-[#0F2D25] text-white rounded-lg hover:bg-[#173f34] disabled:bg-slate-400 flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
        >
          {isLoading ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <CpuChipIcon className="w-4 h-4 text-[#C9A35D]" />
          )}
          Compare Markets
        </button>
      </div>

      {comparison && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[comparison.country_a, comparison.country_b].map((market) => (
            <div
              key={market.name}
              className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4"
            >
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">{market.name}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{market.summary}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 mb-1.5">Advantages</p>
                  <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                    {market.pros.map((pro, i) => (
                      <li key={i}>&bull; {pro}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 mb-1.5">Risks</p>
                  <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                    {market.cons.map((con, i) => (
                      <li key={i}>&bull; {con}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InvestorGlobalMarketplace;