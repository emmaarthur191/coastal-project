/**
 * Financial calculation utilities for Coastal Banking.
 * Mirroring backend logic for better UX and reduced server load.
 * 
 * @see e:/coastal/banking_backend/core/views/calculations.py
 */

export interface CommissionResult {
  agent_id: string | number;
  transaction_amount: number;
  commission_rate: string;
  commission_amount: number;
  calculated_at: string;
}

export interface InterestResult {
  principal: number;
  rate_percentage: number;
  duration_months: number;
  interest_amount: number;
  total_amount: number;
  monthly_repayment: number;
}

/**
 * Calculate commission based on transaction amount.
 * Tiered logic:
 * - < 1,000: 1%
 * - 1,000 to < 10,000: 1.5%
 * - >= 10,000: 2%
 */
export const calculateCommission = (agentId: string | number, amount: number): CommissionResult => {
  let rate = 0.01; // 1%
  if (amount >= 10000) {
    rate = 0.02; // 2%
  } else if (amount >= 1000) {
    rate = 0.015; // 1.5%
  }

  const commission = amount * rate;

  return {
    agent_id: agentId,
    transaction_amount: amount,
    commission_rate: `${(rate * 100).toFixed(1)}%`,
    commission_amount: Number(commission.toFixed(2)),
    calculated_at: new Date().toISOString(),
  };
};

/**
 * Calculate simple interest for loans or savings.
 * Formula: (Principal * Rate * Months) / (100 * 12)
 */
export const calculateInterest = (principal: number, rate: number, months: number): InterestResult => {
  if (months <= 0) {
    return {
      principal,
      rate_percentage: rate,
      duration_months: months,
      interest_amount: 0,
      total_amount: principal,
      monthly_repayment: 0,
    };
  }

  const interest = (principal * rate * months) / (100 * 12);
  const totalAmount = principal + interest;

  return {
    principal,
    rate_percentage: rate,
    duration_months: months,
    interest_amount: Number(interest.toFixed(2)),
    total_amount: Number(totalAmount.toFixed(2)),
    monthly_repayment: Number((totalAmount / months).toFixed(2)),
  };
};

/**
 * Calculate service charges for various operations.
 * Base charge + Tiered percentage-based fee.
 */
export const calculateServiceCharge = (amount: number, serviceType: string = 'general'): number => {
  const baseCharge = 5.0; // Flat fee
  let percentage = 0.005; // 0.5% base

  const type = serviceType.toLowerCase();
  if (type === 'express' || type === 'urgent') {
    percentage = 0.01; // 1% for express
  } else if (type === 'overseas' || type === 'international') {
    percentage = 0.02; // 2% for overseas
  }

  return Number((baseCharge + amount * percentage).toFixed(2));
};
