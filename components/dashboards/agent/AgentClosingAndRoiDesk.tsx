import React from 'react';
import { WidgetTabGroup } from '../../widgets/EmbeddedWidgetToolkit';

const AgentClosingAndRoiDesk: React.FC = () => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Mandate Closing &amp; Client Advisory Desk
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Execute OTPs and exclusive mandates, verify client signatures, and model renovation ROI, yield, and utility costs during viewings.
        </p>
      </div>

      <WidgetTabGroup
        title="Mandate Execution, Signatures & Document Integrity"
        subtitle="Sign exclusive agency mandates or lease agreements, verify counterparty digital signatures, and confirm unmodified deed hashes."
        toolIds={['sign-pdf', 'signature', 'hash-compare']}
      />

      <WidgetTabGroup
        title="Seller & Buyer Advisory Calculators"
        subtitle="Run renovation ROI appraisals, rental cash-flow models, side-by-side comps, insurance quotes, and solar or water operating projections."
        toolIds={[
          'renovation-roi',
          'cash-flow',
          'property-comparison',
          'property-decider',
          'home-insurance',
          'energy-cost',
          'water-usage',
        ]}
      />
    </div>
  );
};

export default AgentClosingAndRoiDesk;
