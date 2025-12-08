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
export type FraudAlertRequest = {
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
    rule_details?: any;
    assigned_to?: string | null;
    investigation_notes?: string;
    resolution?: string;
    resolution_action?: string;
    escalated_at?: string | null;
    escalated_to?: string | null;
    source_ip?: string | null;
    user_agent?: string;
};

