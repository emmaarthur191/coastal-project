/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Serializer for staff payslips.
 */
export type Payslip = {
    readonly id: number;
    staff: number;
    readonly staff_name: string;
    readonly staff_id_display: string;
    month: number;
    year: number;
    readonly month_name: string;
    pay_period_start: string;
    pay_period_end: string;
    base_pay: string;
    allowances?: string;
    overtime_pay?: string;
    bonuses?: string;
    readonly gross_pay: string;
    readonly ssnit_contribution: string;
    tax_deduction?: string;
    other_deductions?: string;
    readonly total_deductions: string;
    readonly net_salary: string;
    pdf_file?: string | null;
    readonly download_url: string;
    generated_by?: number | null;
    readonly generated_by_name: string;
    notes?: string;
    is_paid?: boolean;
    paid_at?: string | null;
    readonly created_at: string;
    readonly updated_at: string;
};

