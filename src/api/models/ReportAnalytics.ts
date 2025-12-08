/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Serializer for ReportAnalytics model.
 */
export type ReportAnalytics = {
    readonly id: string;
    report: string;
    readonly report_title: string;
    total_transactions?: number;
    total_amount?: string;
    average_transaction_amount?: string;
    deposits_count?: number;
    withdrawals_count?: number;
    transfers_count?: number;
    fees_count?: number;
    deposits_amount?: string;
    withdrawals_amount?: string;
    transfers_amount?: string;
    fees_amount?: string;
    cashier_metrics?: any;
    previous_period_comparison?: any;
    trend_data?: any;
    compliance_flags?: any;
    risk_indicators?: any;
    readonly calculated_at: string;
};

