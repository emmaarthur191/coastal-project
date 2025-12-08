/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AlertLevelEnum } from './AlertLevelEnum';
import type { PerformanceAlertStatusEnum } from './PerformanceAlertStatusEnum';
export type PerformanceAlertRequest = {
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
    tags?: any;
    resolution_notes?: string;
    metric?: string | null;
    system_health?: string | null;
    acknowledged_by?: string | null;
    resolved_by?: string | null;
};

