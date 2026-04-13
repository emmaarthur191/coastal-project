/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LoanStatusEnum } from './LoanStatusEnum';
export type PatchedLoan = {
    readonly id?: number;
    readonly user?: number;
    readonly borrower_name?: string;
    readonly borrower_email?: string;
    amount?: string;
    interest_rate?: string;
    term_months?: number;
    /**
     * Purpose of the loan
     */
    purpose?: string | null;
    readonly date_of_birth?: string;
    id_type?: string;
    readonly id_number?: string;
    readonly digital_address?: string;
    town?: string;
    city?: string;
    readonly next_of_kin_1_name?: string;
    next_of_kin_1_relationship?: string;
    readonly next_of_kin_1_phone?: string;
    readonly next_of_kin_1_address?: string;
    readonly next_of_kin_2_name?: string;
    next_of_kin_2_relationship?: string;
    readonly next_of_kin_2_phone?: string;
    readonly next_of_kin_2_address?: string;
    readonly guarantor_1_name?: string;
    guarantor_1_id_type?: string;
    readonly guarantor_1_id_number?: string;
    readonly guarantor_1_phone?: string;
    readonly guarantor_1_address?: string;
    readonly guarantor_2_name?: string;
    guarantor_2_id_type?: string;
    readonly guarantor_2_id_number?: string;
    readonly guarantor_2_phone?: string;
    readonly guarantor_2_address?: string;
    monthly_income?: string;
    employment_status?: string;
    readonly outstanding_balance?: string;
    readonly status?: LoanStatusEnum;
    readonly approved_at?: string | null;
    readonly created_at?: string;
    readonly updated_at?: string;
};

