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
export type FraudAuditTrail = {
    readonly id: string;
    correlation_id: string;
    transaction_id: string;
    user_id: string;
    decision_type: DecisionTypeEnum;
    severity?: SeverityEnum;
    status?: FraudAuditTrailStatusEnum;
    readonly created_at: string;
    readonly updated_at: string;
    expires_at?: string | null;
    created_by?: string | null;
    readonly created_by_name: string;
    reverted_by?: string | null;
    readonly reverted_by_name: string;
    reverted_at?: string | null;
    revert_reason?: string;
    compliance_standard?: string;
    data_classification?: DataClassificationEnum;
    readonly decision_hash: string;
    readonly decision_data_decrypted: string;
};

