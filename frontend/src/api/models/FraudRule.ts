/* generated for fraud detection rules */
import type { SeverityEnum } from './SeverityEnum';

export enum RuleTypeEnum {
    TRANSACTION_AMOUNT = 'transaction_amount',
    VELOCITY = 'velocity',
    GEOGRAPHIC = 'geographic',
    TIME_BASED = 'time_based',
    ACCOUNT_ACTIVITY = 'account_activity',
}

export type FraudRule = {
    readonly id: number;
    name: string;
    description?: string;
    rule_type: RuleTypeEnum;
    severity: SeverityEnum;
    field: string;
    operator: string;
    value: string;
    additional_conditions?: any;
    is_active?: boolean;
    auto_block?: boolean;
    require_approval?: boolean;
    escalation_threshold?: number;
    readonly trigger_count: number;
    readonly false_positive_count: number;
    readonly last_triggered: string | null;
    readonly created_at: string;
    readonly updated_at: string;
};

export type FraudRuleRequest = {
    name: string;
    description?: string;
    rule_type: RuleTypeEnum;
    severity: SeverityEnum;
    field: string;
    operator: string;
    value: string;
    additional_conditions?: any;
    is_active?: boolean;
    auto_block?: boolean;
    require_approval?: boolean;
    escalation_threshold?: number;
};
