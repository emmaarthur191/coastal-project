/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RefundStatusEnum } from './RefundStatusEnum';
import type { RefundTypeEnum } from './RefundTypeEnum';
/**
 * Serializer for Refund model.
 */
export type Refund = {
    readonly id: string;
    original_transaction: string;
    readonly original_transaction_ref: string;
    readonly original_transaction_details: Record<string, any>;
    refund_type?: RefundTypeEnum;
    requested_amount: string;
    approved_amount?: string | null;
    reason: string;
    refund_notes?: string;
    status?: RefundStatusEnum;
    requested_by: string;
    readonly requested_by_name: string;
    requested_at?: string;
    approved_by?: string | null;
    readonly approved_by_name: string;
    approved_at?: string | null;
    approval_notes?: string;
    processed_by?: string | null;
    readonly processed_by_name: string;
    processed_at?: string | null;
    refund_transaction?: string | null;
    requires_supervisor_approval?: boolean;
    compliance_flags?: any;
    risk_score?: string | null;
    readonly audit_trail: any;
    readonly created_at: string;
    readonly updated_at: string;
};

