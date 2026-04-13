/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RuleTypeEnum } from './RuleTypeEnum';
import type { SeverityEnum } from './SeverityEnum';
export type PatchedFraudRule = {
    readonly id?: number;
    name?: string;
    description?: string;
    rule_type?: RuleTypeEnum;
    severity?: SeverityEnum;
    /**
     * Transaction field to evaluate
     */
    field?: string;
    /**
     * Comparison operator (e.g., >, <, ==)
     */
    operator?: string;
    /**
     * Threshold value for the rule
     */
    value?: string;
    additional_conditions?: any;
    is_active?: boolean;
    auto_block?: boolean;
    require_approval?: boolean;
    escalation_threshold?: number;
    readonly trigger_count?: number;
    readonly false_positive_count?: number;
    readonly last_triggered?: string | null;
    readonly created_at?: string;
    readonly updated_at?: string;
};

