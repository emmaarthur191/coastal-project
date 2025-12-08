/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { StatusB1eEnum } from './StatusB1eEnum';
export type SystemHealthRequest = {
    component_name: string;
    component_type: string;
    status?: StatusB1eEnum;
    status_message?: string;
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

