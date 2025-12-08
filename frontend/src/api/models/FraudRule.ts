/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OperatorEnum } from './OperatorEnum';
import type { RuleTypeEnum } from './RuleTypeEnum';
import type { SeverityEnum } from './SeverityEnum';
/**
 * Serializer for FraudRule model.
 */
export type FraudRule = {
    readonly id: string;
    name: string;
    description?: string;
    rule_type: RuleTypeEnum;
    severity?: SeverityEnum;
    field: string;
    operator: OperatorEnum;
    value: string;
    additional_conditions?: any;
    is_active?: boolean;
    auto_block?: boolean;
    require_approval?: boolean;
    escalation_threshold?: number;
    readonly created_by_name: string;
    readonly created_at: string;
    readonly updated_at: string;
    readonly trigger_count: number;
    readonly false_positive_count: number;
    readonly last_triggered: string | null;
};

