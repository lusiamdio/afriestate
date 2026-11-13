import React, { useState, useMemo } from 'react';
import { GoogleGenAI, Type } from '../../../lib/ai';
import type { TaxLegalInfo, Currency } from '../../../types';
import { ToolsIcon, BuildingLibraryIcon } from '../../icons/InvestorDashboardIcons';
import { CpuChipIcon, ArrowUpIcon, ArrowDownIcon, ChartBarIcon } from '../../icons/ActionIcons';
import { useCurrency } from '../../../contexts/CurrencyContext';

type FinancialToolTab = 'calculator' | 'tax';

interface InvestorFinancialToolsProps {
  currency: Currency;
}

const taxLegalSchema = {
  type: Type.OBJECT,
  properties: {
    tax_benefits: { type: Type.ARRAY, items: { type: Type.STRING } },
    legal_restrictions: { type: Type.ARRAY, items: { type: Type.STRING } },
    ownership_structures: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ['tax_benefits', 'legal_restrictions', 'ownership_structures'],
};

const TAX_LEGAL_FALLBACKS: Record<string, TaxLegalInfo> = {
  'South Africa': {
    tax_benefits: [
      'Section 13sex allows accelerated 5% annual depreciation allowances on 5+ new residential units.',
      'Double Taxation Agreements (DTA) with major jurisdictions mitigate withholding tax overlap.',
      'Interest, levies, rates, and maintenance costs remain deductible against rental income.',
    ],
    legal_restrictions: [
      'Non-residents require SARB Exchange Control approval when repatriating leveraged sale proceeds.',
      'Transfer duty scales progressively above the statutory exemption threshold on direct title.',
    ],
    ownership_structures: [
      'Direct Freehold / Sectional Title ownership for single-asset residential holdings.',
      'South African Proprietary Limited (Pty Ltd) SPV for multi-unit portfolios and ring-fenced liability.',
      'Inter-vivos Family Trust combined with corporate shareholding for succession planning.',
    ],
  },
  Kenya: {
    tax_benefits: [
      '10% Residential Rental Income Tax regime available on qualifying annual rental turnover.',
      'Capital allowances apply on commercial buildings and qualifying hospitality developments.',
      'Special Economic Zone (SEZ) incentives offer reduced corporate tax rates.',
    ],
    legal_restrictions: [
      'Foreign nationals may hold leasehold titles up to 99 years rather than freehold tenure.',
      'Land Control Board consent is required for agricultural-zoned parcels.',
    ],
    ownership_structures: [
      '99-Year Registered Leasehold in personal or corporate name.',
      'Kenyan Limited Liability Company (LLC) holding long-term commercial or residential leases.',
    ],
  },
  Portugal: {
    tax_benefits: [
      '28% flat withholding option or progressive scale deductions for documented property expenses.',
      'EU-wide double taxation relief and transparent municipal IMI schedules.',
    ],
    legal_restrictions: [
      'Alojamento Local (short-term rental) licenses are capped in high-density Lisbon and Porto parishes.',
      'IMT municipal transfer tax and stamp duty apply at deed execution.',
    ],
    ownership_structures: [
      'Direct Personal Deed (Escritura) with Portuguese fiscal NIF registration.',
      'Portuguese Unipessoal Lda SPV for multi-property commercial operations.',
    ],
  },
  'United Arab Emirates': {
    tax_benefits: [
      '0% personal income tax on residential rental yields and zero capital gains tax on direct sales.',
      '10-year Golden Visa eligibility for qualifying real estate portfolios over AED 2M.',
    ],
    legal_restrictions: [
      'Foreign freehold ownership is limited to designated master-planned freehold zones.',
      '4% DLD title registration fee applies upon transfer.',
    ],
    ownership_structures: [
      'Direct Freehold Registration via Dubai Land Department (DLD).',
      'DIFC or ADGM Foundation / Holding SPV for multi-generational family offices.',
    ],
  },
};

const InvestorFinancialTools: React.FC<InvestorFinancialToolsProps> = () => {
  const [activeTab, setActiveTab] = useState<FinancialToolTab>('calculator');

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Financial &amp; ROI Lab
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Underwrite leveraged cash flows, stress-test assumptions, and review cross-border tax frameworks.
          </p>
        </div>

        <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('calculator')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'calculator'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ToolsIcon className="w-4 h-4" /> Smart ROI Calculator
          </button>
          <button
            onClick={() => setActiveTab('tax')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'tax'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BuildingLibraryIcon className="w-4 h-4" /> Tax &amp; Legal Hub
          </button>
        </div>
      </div>

      {activeTab === 'calculator' ? <SmartROICalculator /> : <TaxLegalHub />}
    </div>
  );
};

const InputField: React.FC<{
  label: string;
  name: string;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  prefix?: string;
  unit?: string;
  step?: string;
}> = ({ label, name, value, onChange, prefix, unit, step = '1' }) => (
  <div>
    <label htmlFor={name} className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
      {label}
    </label>
    <div className="relative">
      {prefix && (
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs font-mono">
          {prefix}
        </span>
      )}
      <input
        type="number"
        name={name}
        id={name}
        value={value}
        onChange={onChange}
        step={step}
        className={`w-full py-2 text-sm font-mono tabular-nums border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/70 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F2D25] ${
          prefix ? 'pl-9' : 'px-3'
        } ${unit ? 'pr-9' : 'pr-3'}`}
      />
      {unit && (
        <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 text-xs font-mono">
          {unit}
        </span>
      )}
    </div>
  </div>
);

const SmartROICalculator: React.FC = () => {
  const { currency, formatCurrency } = useCurrency();
  const [inputs, setInputs] = useState({
    price: 500000,
    downPayment: 100000,
    interestRate: 6.5,
    loanTerm: 30,
    monthlyRent: 3400,
    propertyTax: 4800,
    insurance: 1200,
    maintenance: 2400,
    vacancyRate: 5,
  });

  const [simulation, setSimulation] = useState({
    rentIncrease: 3,
    appreciation: 4,
    expenseIncrease: 2,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputs((prev) => ({ ...prev, [e.target.name]: Number(e.target.value) || 0 }));
  };

  const handleSimChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSimulation((prev) => ({ ...prev, [e.target.name]: Number(e.target.value) }));
  };

  const results = useMemo(() => {
    const { price, downPayment, interestRate, loanTerm, monthlyRent, propertyTax, insurance, maintenance, vacancyRate } =
      inputs;
    const loanAmount = Math.max(0, price - downPayment);
    const monthlyInterest = interestRate / 100 / 12;
    const numPayments = Math.max(1, loanTerm * 12);
    const monthlyMortgage =
      monthlyInterest > 0
        ? (loanAmount * monthlyInterest * Math.pow(1 + monthlyInterest, numPayments)) /
          (Math.pow(1 + monthlyInterest, numPayments) - 1)
        : loanAmount / numPayments;

    const totalInvestment = downPayment;
    const grossMonthlyIncome = monthlyRent;
    const monthlyVacancyLoss = grossMonthlyIncome * (vacancyRate / 100);
    const monthlyExpenses = propertyTax / 12 + insurance / 12 + maintenance / 12;
    const totalMonthlyExpenses = monthlyExpenses + monthlyVacancyLoss;
    const monthlyCashFlow = grossMonthlyIncome - (monthlyMortgage + totalMonthlyExpenses);
    const annualCashFlow = monthlyCashFlow * 12;
    const cashOnCashROI = totalInvestment > 0 ? (annualCashFlow / totalInvestment) * 100 : 0;
    const totalMonthlyPayment = monthlyMortgage + monthlyExpenses;

    return { monthlyCashFlow, cashOnCashROI, monthlyMortgage, monthlyExpenses, totalMonthlyPayment };
  }, [inputs]);

  const projection = useMemo(() => {
    let futureValue = inputs.price;
    let futureRent = inputs.monthlyRent;
    let futureExpenses = results.monthlyExpenses;
    const years = [];
    for (let i = 1; i <= 5; i++) {
      futureValue *= 1 + simulation.appreciation / 100;
      futureRent *= 1 + simulation.rentIncrease / 100;
      futureExpenses *= 1 + simulation.expenseIncrease / 100;
      const futureCashFlow = futureRent * (1 - inputs.vacancyRate / 100) - (results.monthlyMortgage + futureExpenses);
      years.push({ year: i, cashFlow: futureCashFlow * 12 });
    }
    const maxProjectedCashflow = Math.max(...years.map((y) => Math.abs(y.cashFlow)), 1);
    return { years, endValue: futureValue, maxProjectedCashflow };
  }, [inputs, simulation, results]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
      {/* Underwriting Inputs */}
      <div className="lg:col-span-2 space-y-5">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
          <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
            Acquisition &amp; Debt
          </h4>
          <div className="grid grid-cols-2 gap-3.5">
            <InputField label="Purchase Price" name="price" value={inputs.price} onChange={handleInputChange} prefix={currency} />
            <InputField label="Equity Down" name="downPayment" value={inputs.downPayment} onChange={handleInputChange} prefix={currency} />
            <InputField label="Interest Rate" name="interestRate" value={inputs.interestRate} onChange={handleInputChange} unit="%" step="0.1" />
            <InputField label="Term" name="loanTerm" value={inputs.loanTerm} onChange={handleInputChange} unit="Yr" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
          <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
            Income &amp; Operating Cost
          </h4>
          <div className="grid grid-cols-2 gap-3.5">
            <InputField label="Monthly Rent" name="monthlyRent" value={inputs.monthlyRent} onChange={handleInputChange} prefix={currency} />
            <InputField label="Annual Tax" name="propertyTax" value={inputs.propertyTax} onChange={handleInputChange} prefix={currency} />
            <InputField label="Insurance / Yr" name="insurance" value={inputs.insurance} onChange={handleInputChange} prefix={currency} />
            <InputField label="CapEx / Yr" name="maintenance" value={inputs.maintenance} onChange={handleInputChange} prefix={currency} />
            <InputField label="Vacancy Buffer" name="vacancyRate" value={inputs.vacancyRate} onChange={handleInputChange} unit="%" />
          </div>
        </div>
      </div>

      {/* Results & Projections */}
      <div className="lg:col-span-3 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 overflow-hidden">
          <div className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Net Monthly Cash Flow
              </p>
              {results.monthlyCashFlow >= 0 ? (
                <ArrowUpIcon className="w-4 h-4 text-emerald-600" />
              ) : (
                <ArrowDownIcon className="w-4 h-4 text-red-600" />
              )}
            </div>
            <p
              className={`text-3xl font-bold mt-2 font-mono tabular-nums ${
                results.monthlyCashFlow >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
              }`}
            >
              {formatCurrency(results.monthlyCashFlow)}
            </p>
          </div>

          <div className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Cash-on-Cash Yield
              </p>
              <ChartBarIcon className="w-4 h-4 text-[#C9A35D]" />
            </div>
            <p
              className={`text-3xl font-bold mt-2 font-mono tabular-nums ${
                results.cashOnCashROI >= 0 ? 'text-slate-900 dark:text-white' : 'text-red-600 dark:text-red-400'
              }`}
            >
              {results.cashOnCashROI.toFixed(2)}%
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
          <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            Monthly Debt &amp; Expense Breakdown
          </h4>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            <div className="py-2 flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-300">Principal &amp; Interest</span>
              <span className="font-mono tabular-nums font-medium text-slate-900 dark:text-white">
                {formatCurrency(results.monthlyMortgage)}
              </span>
            </div>
            <div className="py-2 flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-300">Taxes, Insurance &amp; CapEx</span>
              <span className="font-mono tabular-nums font-medium text-slate-900 dark:text-white">
                {formatCurrency(results.monthlyExpenses)}
              </span>
            </div>
            <div className="pt-3 flex justify-between items-center">
              <span className="font-semibold text-slate-900 dark:text-white">Total Monthly Outflow</span>
              <span className="font-mono tabular-nums font-bold text-base text-slate-900 dark:text-white">
                {formatCurrency(results.totalMonthlyPayment)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-5">
          <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            5-Year Sensitivity Simulation
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 dark:text-slate-300">Rent Growth</span>
                <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                  {simulation.rentIncrease}%/yr
                </span>
              </div>
              <input
                type="range"
                name="rentIncrease"
                min="0"
                max="10"
                step="0.5"
                value={simulation.rentIncrease}
                onChange={handleSimChange}
                className="w-full accent-[#0F2D25] cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 dark:text-slate-300">Appreciation</span>
                <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                  {simulation.appreciation}%/yr
                </span>
              </div>
              <input
                type="range"
                name="appreciation"
                min="0"
                max="10"
                step="0.5"
                value={simulation.appreciation}
                onChange={handleSimChange}
                className="w-full accent-[#0F2D25] cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 dark:text-slate-300">Expense Inflation</span>
                <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                  {simulation.expenseIncrease}%/yr
                </span>
              </div>
              <input
                type="range"
                name="expenseIncrease"
                min="0"
                max="10"
                step="0.5"
                value={simulation.expenseIncrease}
                onChange={handleSimChange}
                className="w-full accent-[#0F2D25] cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="md:col-span-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200/70 dark:border-slate-800">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-3">Annual Net Cash Flow</p>
              <div className="flex items-end h-28 gap-2.5 border-b border-slate-200 dark:border-slate-700 pb-2">
                {projection.years.map((y) => {
                  const pct = Math.max(8, Math.round((Math.max(0, y.cashFlow) / projection.maxProjectedCashflow) * 100));
                  return (
                    <div key={y.year} className="flex-1 flex flex-col items-center justify-end h-full gap-1 group relative">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-2 bg-slate-900 text-white text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded whitespace-nowrap">
                        {formatCurrency(y.cashFlow)}
                      </span>
                      <div
                        className={`w-full max-w-[36px] rounded-t transition-colors ${
                          y.cashFlow >= 0
                            ? 'bg-[#0F2D25] dark:bg-emerald-500'
                            : 'bg-red-500/80'
                        }`}
                        style={{ height: `${y.cashFlow > 0 ? pct : 12}%` }}
                      />
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Y{y.year}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200/70 dark:border-slate-800 flex flex-col justify-center">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Yr 5 Exit Value
              </p>
              <p className="text-2xl font-bold text-[#0F2D25] dark:text-emerald-400 font-mono tabular-nums mt-2">
                {formatCurrency(Math.round(projection.endValue))}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Compounded @ {simulation.appreciation}%/yr
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TaxLegalHub: React.FC = () => {
  const [country, setCountry] = useState('South Africa');
  const [report, setReport] = useState<TaxLegalInfo | null>(TAX_LEGAL_FALLBACKS['South Africa']);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const ai = new GoogleGenAI();
      const prompt = `Generate a concise tax and legal brief for foreign real estate investors in ${country}. Provide JSON with arrays for tax_benefits, legal_restrictions, and common ownership_structures (max 3 concise points each).`;
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json', responseSchema: taxLegalSchema },
      });
      setReport(JSON.parse(response.text.trim()));
    } catch {
      setReport(TAX_LEGAL_FALLBACKS[country] || TAX_LEGAL_FALLBACKS['South Africa']);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <select
          value={country}
          onChange={(e) => {
            const val = e.target.value;
            setCountry(val);
            if (TAX_LEGAL_FALLBACKS[val]) setReport(TAX_LEGAL_FALLBACKS[val]);
          }}
          className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
        >
          {['South Africa', 'Kenya', 'Portugal', 'United Arab Emirates'].map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="bg-[#0F2D25] text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-[#173f34] disabled:bg-slate-400 transition-colors whitespace-nowrap"
        >
          {isLoading ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <CpuChipIcon className="w-4 h-4 text-[#C9A35D]" />
          )}
          Refresh Jurisdictional Brief
        </button>
      </div>

      {report && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Tax Incentives</h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {report.tax_benefits.map((item, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-emerald-600 font-bold">&bull;</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Regulatory Considerations</h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {report.legal_restrictions.map((item, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-amber-600 font-bold">&bull;</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Common Holding Vehicles</h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {report.ownership_structures.map((item, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-[#C9A35D] font-bold">&bull;</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestorFinancialTools;