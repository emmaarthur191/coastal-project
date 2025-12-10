/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SystemHealthStatusEnum } from './SystemHealthStatusEnum';
export type SystemHealth = {
    readonly id: string;
    readonly is_healthy: string;
    readonly needs_alert: string;
    component_name: string;
    component_type: string;
    status?: SystemHealthStatusEnum;
    status_message?: string;
    readonly last_check: string;
    next_check?: string | null;
    response_time?: string | null;
    cpu_usage?: string | null;
    memory_usage?: string | null;
    disk_usage?: string | null;
    active_connections?: number;
    alert_enabled?: boolean;
    alert_thresholds?: any;
    alert_contacts?: any;
    incident_count?: number;
    last_incident?: string | null;
    downtime_minutes?: number;
    location?: string;
    version?: string;
    tags?: any;
};

