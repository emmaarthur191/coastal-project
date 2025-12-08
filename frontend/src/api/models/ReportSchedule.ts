/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DeliveryMethod117Enum } from './DeliveryMethod117Enum';
import type { FrequencyEnum } from './FrequencyEnum';
import type { ReportScheduleStatusEnum } from './ReportScheduleStatusEnum';
/**
 * Serializer for ReportSchedule model.
 */
export type ReportSchedule = {
    readonly id: string;
    template: string;
    readonly template_name: string;
    name: string;
    description?: string;
    frequency: FrequencyEnum;
    readonly frequency_display: string;
    next_run: string;
    readonly last_run: string | null;
    expires_at?: string | null;
    recipients?: any;
    delivery_method?: DeliveryMethod117Enum;
    readonly delivery_method_display: string;
    delivery_config?: any;
    status?: ReportScheduleStatusEnum;
    readonly status_display: string;
    is_active?: boolean;
    readonly created_by: string;
    readonly created_by_name: string;
    readonly created_at: string;
    readonly updated_at: string;
    readonly last_error: string;
    readonly consecutive_failures: number;
};

