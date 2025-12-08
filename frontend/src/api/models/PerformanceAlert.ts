/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AlertLevelEnum } from './AlertLevelEnum';
import type { PerformanceAlertStatusEnum } from './PerformanceAlertStatusEnum';
export type PerformanceAlert = {
    readonly id: string;
    readonly is_overdue: string;
    title: string;
    description: string;
    alert_level?: AlertLevelEnum;
    status?: PerformanceAlertStatusEnum;
    threshold_value?: string | null;
    actual_value?: string | null;
    threshold_operator?: string;
    notified_users?: any;
    notification_channels?: any;
    escalation_policy?: any;
    readonly triggered_at: string;
    readonly acknowledged_at: string | null;
    readonly resolved_at: string | null;
    tags?: any;
    resolution_notes?: string;
    metric?: string | null;
    system_health?: string | null;
    acknowledged_by?: string | null;
    resolved_by?: string | null;
};

