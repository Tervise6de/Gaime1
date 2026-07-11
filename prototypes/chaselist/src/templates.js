'use strict';

// Built-in request list templates. Realistic bookkeeping document asks.
module.exports = [
  {
    id: 'monthly-close',
    name: 'Monthly close',
    items: [
      { label: 'Bank statements (all accounts)', description: 'PDF or CSV export for the full month, every business account.' },
      { label: 'Credit card statements', description: 'Statement PDF for each business card for the month.' },
      { label: 'Loan statements', description: 'Any loan or line-of-credit statement showing month-end balance.' },
      { label: 'Payroll reports', description: 'Payroll journal / summary report from your payroll provider.' },
      { label: 'Receipts over $75', description: 'Photos or PDFs of receipts for purchases over $75 this month.' },
      { label: 'New vendor invoices', description: 'Bills received this month that are not yet in the system.' },
    ],
  },
  {
    id: 'year-end-tax',
    name: 'Year-end tax package',
    items: [
      { label: 'December bank & card statements', description: 'Final statements of the year for all accounts.' },
      { label: 'Year-end loan statements', description: 'Statements showing outstanding balances at Dec 31.' },
      { label: 'Asset purchase invoices', description: 'Invoices for equipment/vehicles bought this year (for depreciation).' },
      { label: 'Payroll annual summary (W-3/T4 summary)', description: 'Annual payroll totals from your payroll provider.' },
      { label: '1099 / contractor payment list', description: 'Contractors paid $600+ with names, addresses, amounts.' },
      { label: 'Inventory count at year end', description: 'Spreadsheet or photo of the year-end physical count.' },
      { label: 'Prior-year tax return', description: 'Only if this is our first year preparing your return.' },
      { label: 'Mileage log', description: 'Business mileage log or app export for the year.' },
    ],
  },
  {
    id: 'new-client-onboarding',
    name: 'New client onboarding',
    items: [
      { label: 'Articles of incorporation / LLC agreement', description: 'Formation documents for the business entity.' },
      { label: 'EIN letter (IRS CP-575)', description: 'The IRS letter confirming your EIN.' },
      { label: 'Last filed tax return', description: 'Most recent business tax return, all pages.' },
      { label: 'Bank statements - last 3 months', description: 'All business accounts, most recent 3 months.' },
      { label: 'Chart of accounts / accounting file backup', description: 'Export or backup from your previous bookkeeping system.' },
      { label: 'Outstanding invoices & bills list', description: 'What customers owe you and what you owe vendors, as of today.' },
      { label: 'Photo ID of owner(s)', description: 'For our engagement / KYC records.' },
    ],
  },
];
