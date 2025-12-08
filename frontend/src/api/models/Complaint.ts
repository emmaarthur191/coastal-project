/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ComplaintStatusEnum } from './ComplaintStatusEnum';
import type { ComplaintTypeEnum } from './ComplaintTypeEnum';
import type { EscalationLevelEnum } from './EscalationLevelEnum';
import type { SeverityEnum } from './SeverityEnum';
/**
 * Serializer for Complaint model.
 */
export type Complaint = {
    readonly id: string;
    account: string;
    readonly account_number: string;
    related_transaction?: string | null;
    readonly related_transaction_ref: string;
    complaint_type: ComplaintTypeEnum;
    priority?: SeverityEnum;
    subject: string;
    description: string;
    status?: ComplaintStatusEnum;
    escalation_level?: EscalationLevelEnum;
    submitted_by: string;
    readonly submitted_by_name: string;
    submitted_at?: string;
    assigned_to?: string | null;
    readonly assigned_to_name: string;
    assigned_at?: string | null;
    resolved_by?: string | null;
    readonly resolved_by_name: string;
    resolved_at?: string | null;
    resolution?: string;
    resolution_satisfaction?: string;
    escalated_at?: string | null;
    escalated_by?: string | null;
    readonly escalated_by_name: string;
    escalation_reason?: string;
    customer_contacted?: boolean;
    contact_attempts?: number;
    last_contact_date?: string | null;
    follow_up_required?: boolean;
    follow_up_date?: string | null;
    attachments?: any;
    evidence?: any;
    readonly audit_trail: any;
    readonly created_at: string;
    readonly updated_at: string;
};

