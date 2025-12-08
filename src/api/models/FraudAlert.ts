/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AlertTypeEnum } from './AlertTypeEnum';
import type { FraudAlertStatusEnum } from './FraudAlertStatusEnum';
import type { SeverityEnum } from './SeverityEnum';
/**
 * Serializer for FraudAlert model.
 */
export type FraudAlert = {
    readonly id: string;
    alert_type: AlertTypeEnum;
    priority?: SeverityEnum;
    status?: FraudAlertStatusEnum;
    title: string;
    description: string;
    fraud_score?: number;
    risk_level?: SeverityEnum;
    transaction?: string | null;
    account?: string | null;
    user?: string | null;
    readonly transaction_details: string;
    readonly account_details: string;
    rule_details?: any;
    assigned_to?: string | null;
    readonly assigned_to_name: string;
    investigation_notes?: string;
    resolution?: string;
    resolution_action?: string;
    escalated_at?: string | null;
    escalated_to?: string | null;
    readonly escalated_to_name: string;
    readonly created_at: string;
    readonly updated_at: string;
    readonly resolved_at: string | null;
    source_ip?: string | null;
    user_agent?: string;
};

