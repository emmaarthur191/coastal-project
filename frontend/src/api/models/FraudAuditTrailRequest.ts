/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DataClassificationEnum } from './DataClassificationEnum';
import type { DecisionTypeEnum } from './DecisionTypeEnum';
import type { FraudAuditTrailStatusEnum } from './FraudAuditTrailStatusEnum';
import type { SeverityEnum } from './SeverityEnum';
/**
 * Serializer for FraudAuditTrail model.
 */
export type FraudAuditTrailRequest = {
    correlation_id: string;
    transaction_id: string;
    user_id: string;
    decision_type: DecisionTypeEnum;
    severity?: SeverityEnum;
    status?: FraudAuditTrailStatusEnum;
    expires_at?: string | null;
    created_by?: string | null;
    reverted_by?: string | null;
    reverted_at?: string | null;
    revert_reason?: string;
    compliance_standard?: string;
    data_classification?: DataClassificationEnum;
};

