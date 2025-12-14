export interface FraudRule {
    id: number;
    name: string;
    description: string;
    rule_type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    field: string;
    operator: string;
    value: string;
    additional_conditions?: Record<string, any>;
    is_active: boolean;
    auto_block: boolean;
    require_approval: boolean;
    escalation_threshold?: number;
    trigger_count?: number;
    false_positive_count?: number;
    last_triggered?: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface FraudRuleRequest {
    name: string;
    description?: string;
    rule_type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    field: string;
    operator: string;
    value: string;
    additional_conditions?: Record<string, any>;
    is_active?: boolean;
    auto_block?: boolean;
    require_approval?: boolean;
    escalation_threshold?: number;
}
