import React, { useState } from 'react';
import { GoogleGenAI } from '../../../lib/ai';
import type { Property } from '../../../types';
import { ListingType } from '../../../types';
import { SparklesIcon } from '../../icons/ActionIcons';

interface AIPortfolioSummaryProps {
  userProperties: Property[];
}

const AIPortfolioSummary: React.FC<AIPortfolioSummaryProps> = ({ userProperties }) => {
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const buildFallbackSummary = () => {
    const count = userProperties.length;
    const totalVal = userProperties.reduce((sum, p) => sum + p.price, 0);
    const cities = Array.from(new Set(userProperties.map((p) => p.address.city))).slice(0, 3);
    const rentalCount = userProperties.filter((p) => p.listingType === ListingType.RENT).length;

    return `Your portfolio currently tracks ${count} ${count === 1 ? 'asset' : 'assets'} valued at roughly $${totalVal.toLocaleString()} across ${cities.length > 0 ? cities.join(', ') : 'key African metros'}. ${
      rentalCount > 0
        ? `Cash-flowing rental holdings (${rentalCount}) provide steady yield coverage against holding costs.`
        : 'Capital appreciation positions anchor long-term equity growth across prime residential corridors.'
    } Adding secondary income-producing units in high-occupancy business districts would improve diversification and annualized yield.`;
  };

  const handleGenerateSummary = async () => {
    setIsLoading(true);
    try {
      const ai = new GoogleGenAI();
      const simplifiedPortfolio = userProperties.map((p) => ({
        type: p.propertyType,
        location: p.address.city,
        current_value: p.price,
        purchase_price: p.purchasePrice,
        rental_income_monthly: p.listingType === ListingType.RENT ? p.price : 0,
      }));

      const prompt = `You are a concise real estate portfolio analyst. Based on the following JSON data of an investor's properties, provide a 3-4 sentence summary of portfolio health. Highlight its primary strength and one concrete next opportunity (diversification, yield optimization, or refinancing). Speak directly in a clear institutional tone.

Portfolio Data:
${JSON.stringify(simplifiedPortfolio, null, 2)}`;

      const result = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
      setSummary(result.text || buildFallbackSummary());
    } catch {
      setSummary(buildFallbackSummary());
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white font-sans">Portfolio Intelligence</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Automated risk, yield, and geographic concentration review</p>
        </div>
        <button
          onClick={handleGenerateSummary}
          disabled={isLoading}
          className="px-3.5 py-2 text-xs font-semibold bg-[#0F2D25] text-white rounded-lg hover:bg-[#173f34] disabled:bg-slate-400 flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
        >
          {isLoading ? (
            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <SparklesIcon className="w-4 h-4 text-[#C9A35D]" />
          )}
          {isLoading ? 'Analyzing...' : 'Generate Brief'}
        </button>
      </div>

      <div className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 p-4 rounded-lg min-h-[88px] leading-relaxed">
        {summary ? (
          <p>{summary}</p>
        ) : (
          <p className="text-slate-500 dark:text-slate-400 text-xs">
            Select &ldquo;Generate Brief&rdquo; to evaluate your current asset allocation, net rental coverage, and rebalancing priorities.
          </p>
        )}
      </div>
    </div>
  );
};

export default AIPortfolioSummary;
