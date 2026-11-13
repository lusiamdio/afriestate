import React, { useMemo, useState } from 'react';
import type { Property, User, InvestmentMetrics, Currency } from '../../../types';
import { ListingType } from '../../../types';
import { ChartBarIcon, ArrowUpIcon, ArrowDownIcon } from '../../icons/ActionIcons';
import { ListBulletIcon, Squares2X2Icon, MapIcon } from '@heroicons/react/20/solid';
import PortfolioMap from './PortfolioMap';
import { useCurrency } from '../../../contexts/CurrencyContext';

interface InvestorPortfolioProps {
  user: User;
  allProperties: Property[];
  savedProperties: Property[];
  currency: Currency;
}

type ViewMode = 'list' | 'grid' | 'map';

const calculateMetrics = (property: Property): InvestmentMetrics => {
  const purchasePrice = property.purchasePrice || property.price * 0.85;
  const currentPrice = property.price;
  const roi = purchasePrice > 0 ? ((currentPrice - purchasePrice) / purchasePrice) * 100 : 0;

  let annualYield = 0;
  if (property.listingType === ListingType.RENT && purchasePrice > 0) {
    annualYield = ((property.price * 12) / purchasePrice) * 100;
  }
  return { roi, annualYield };
};

const PerformanceGraph: React.FC<{ data: { date: number; price: number }[] }> = ({ data }) => {
  const points = useMemo(() => {
    if (!data || data.length < 2) return '';
    const prices = data.map((d) => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    const dates = data.map((d) => d.date);
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    const dateRange = maxDate - minDate;

    return data
      .map((d) => {
        const x = dateRange > 0 ? ((d.date - minDate) / dateRange) * 100 : 50;
        const y = priceRange > 0 ? 18 - ((d.price - minPrice) / priceRange) * 14 : 10;
        return `${x},${y}`;
      })
      .join(' ');
  }, [data]);

  return (
    <div className="h-14 flex items-end">
      <svg viewBox="0 0 100 20" className="w-full h-full" preserveAspectRatio="none">
        <polyline
          points={points}
          stroke="#10b981"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

const InvestmentCard: React.FC<{
  property: Property;
  metrics: InvestmentMetrics;
  formatCurrency: (amount: number) => string;
}> = ({ property, metrics, formatCurrency }) => {
  const isOutperforming = property.marketROI !== undefined && metrics.roi > property.marketROI;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 flex flex-col lg:flex-row gap-5">
      <img
        src={property.images[0]}
        alt={property.title}
        className="w-full lg:w-52 h-44 lg:h-auto object-cover rounded-lg flex-shrink-0 bg-slate-100 dark:bg-slate-800"
        referrerPolicy="no-referrer"
      />
      <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="min-w-0">
          <h4 className="font-semibold text-base text-slate-900 dark:text-white truncate">{property.title}</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {property.address.city} · {property.propertyType}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Valuation
              </p>
              <p className="font-bold text-lg text-slate-900 dark:text-white font-mono tabular-nums mt-0.5">
                {formatCurrency(property.price)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total ROI
              </p>
              <p
                className={`font-bold text-lg font-mono tabular-nums mt-0.5 ${
                  metrics.roi >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {metrics.roi >= 0 ? '+' : ''}
                {metrics.roi.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {property.occupancyRate !== undefined && (
            <div className="flex items-center gap-3.5">
              <div className="relative w-12 h-12 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    className="stroke-slate-200 dark:stroke-slate-800"
                    strokeWidth="3.5"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    className="stroke-[#0F2D25] dark:stroke-emerald-500"
                    strokeWidth="3.5"
                    strokeDasharray={`${property.occupancyRate}, 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono tabular-nums">
                    {property.occupancyRate}%
                  </span>
                </div>
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Occupancy Rate
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">Trailing 12-month average</p>
              </div>
            </div>
          )}

          {property.marketROI !== undefined && (
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg shrink-0 ${
                  isOutperforming
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                    : 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400'
                }`}
              >
                {isOutperforming ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />}
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Market Benchmark
                </p>
                <p
                  className={`font-semibold text-xs mt-0.5 ${
                    isOutperforming ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {isOutperforming ? 'Outperforming' : 'Trailing'} by{' '}
                  <span className="font-mono tabular-nums">
                    {Math.abs(metrics.roi - property.marketROI).toFixed(1)}%
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {property.priceHistory && property.priceHistory.length > 1 && (
            <div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Valuation Trajectory
              </p>
              <PerformanceGraph data={property.priceHistory} />
            </div>
          )}
          {property.financials && property.financials.length > 0 && (
            <div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Recent Cash Flows
              </p>
              <div className="space-y-1">
                {property.financials.slice(0, 3).map((fin) => (
                  <div key={`${fin.date}-${fin.description}`} className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 dark:text-slate-400 truncate pr-2">
                      {fin.description}
                    </span>
                    <span
                      className={`font-mono tabular-nums font-semibold shrink-0 ${
                        fin.type === 'Income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {fin.type === 'Income' ? '+' : '-'}
                      {formatCurrency(Math.abs(fin.amount))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const InvestorPortfolio: React.FC<InvestorPortfolioProps> = ({ allProperties, savedProperties }) => {
  const [view, setView] = useState<ViewMode>('list');
  const { formatCurrency } = useCurrency();

  const userProperties = useMemo(() => {
    const owned = allProperties.filter((p) => p.agent.name === 'Peter Van der Merwe');
    return owned.length > 0 ? owned : allProperties.slice(0, 4);
  }, [allProperties]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            My Investments
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Asset-level ROI, occupancy benchmarks, and historical cash flows.
          </p>
        </div>

        <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg self-start sm:self-auto">
          <button
            onClick={() => setView('list')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
              view === 'list'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ListBulletIcon className="w-4 h-4" /> Ledger
          </button>
          <button
            onClick={() => setView('grid')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
              view === 'grid'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Squares2X2Icon className="w-4 h-4" /> Grid
          </button>
          <button
            onClick={() => setView('map')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
              view === 'map'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <MapIcon className="w-4 h-4" /> Map
          </button>
        </div>
      </div>

      {userProperties.length > 0 ? (
        <div>
          {view === 'list' && (
            <div className="space-y-4">
              {userProperties.map((prop) => (
                <InvestmentCard
                  key={prop.id}
                  property={prop}
                  metrics={calculateMetrics(prop)}
                  formatCurrency={formatCurrency}
                />
              ))}
            </div>
          )}

          {view === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {userProperties.map((prop) => {
                const metrics = calculateMetrics(prop);
                return (
                  <div
                    key={prop.id}
                    className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden group"
                  >
                    <div className="aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <img
                        src={prop.images[0]}
                        alt={prop.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="p-4">
                      <h4 className="font-semibold text-sm text-slate-900 dark:text-white truncate">{prop.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{prop.address.city}</p>
                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-sm font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                          {formatCurrency(prop.price)}
                        </span>
                        <span
                          className={`text-sm font-bold font-mono tabular-nums ${
                            metrics.roi >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600'
                          }`}
                        >
                          {metrics.roi >= 0 ? '+' : ''}
                          {metrics.roi.toFixed(1)}% ROI
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {view === 'map' && (
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <PortfolioMap ownedProperties={userProperties} watchlistProperties={savedProperties} />
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <ChartBarIcon className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mt-3">No Investments Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Properties you own or manage will appear here.
          </p>
        </div>
      )}
    </div>
  );
};

export default InvestorPortfolio;