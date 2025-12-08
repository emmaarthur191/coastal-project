/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DeliveryMethod117Enum } from './DeliveryMethod117Enum';
import type { FrequencyEnum } from './FrequencyEnum';
/**
 * Serializer for creating report schedules.
 */
export type ReportScheduleCreateRequest = {
    template: string;
    name: string;
    description?: string;
    frequency: FrequencyEnum;
    next_run: string;
    expires_at?: string | null;
    recipients?: any;
    delivery_method?: DeliveryMethod117Enum;
    delivery_config?: any;
};

