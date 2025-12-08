/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RefundStatusEnum } from './RefundStatusEnum';
import type { RefundTypeEnum } from './RefundTypeEnum';
/**
 * Serializer for Refund model.
 */
export type RefundRequest = {
    original_transaction: string;
    refund_type?: RefundTypeEnum;
    requested_amount: string;
    approved_amount?: string | null;
    reason: string;
    refund_notes?: string;
    status?: RefundStatusEnum;
    requested_by: string;
    requested_at?: string;
    approved_by?: string | null;
    approved_at?: string | null;
    approval_notes?: string;
    processed_by?: string | null;
    processed_at?: string | null;
    refund_transaction?: string | null;
    requires_supervisor_approval?: boolean;
    compliance_flags?: any;
    risk_score?: string | null;
};

