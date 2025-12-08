/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ComponentTypeEnum } from './ComponentTypeEnum';
import type { StatusB1eEnum } from './StatusB1eEnum';
/**
 * Serializer for health check results.
 */
export type HealthCheck = {
    readonly id: string;
    readonly is_healthy: string;
    readonly should_alert: string;
    component_name: string;
    component_type: ComponentTypeEnum;
    status?: StatusB1eEnum;
    status_message?: string;
    response_time?: string | null;
    metrics?: any;
    dependencies?: any;
    check_url?: string;
    check_timeout?: number;
    check_interval?: number;
    alert_enabled?: boolean;
    alert_thresholds?: any;
    last_alert_sent?: string | null;
    consecutive_failures?: number;
    last_success?: string | null;
    last_failure?: string | null;
    location?: string;
    environment?: string;
    tags?: any;
    readonly created_at: string;
    readonly updated_at: string;
};

