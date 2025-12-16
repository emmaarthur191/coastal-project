/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FrequencyEnum } from './FrequencyEnum';
/**
 * Serializer for report schedules.
 */
export type ReportSchedule = {
    readonly id: number;
    template: number;
    readonly template_name: string;
    name: string;
    frequency: FrequencyEnum;
    readonly frequency_display: string;
    day_of_week?: number | null;
    day_of_month?: number | null;
    time_of_day: string;
    format?: string;
    parameters?: any;
    email_recipients?: any;
    is_active?: boolean;
    readonly last_run: string | null;
    readonly next_run: string | null;
    readonly created_by: number | null;
    readonly created_by_name: string;
    readonly created_at: string;
    readonly updated_at: string;
};

