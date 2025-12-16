/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DeliveryMethodEnum } from './DeliveryMethodEnum';
import type { RequestTypeEnum } from './RequestTypeEnum';
import type { ServiceRequestStatusEnum } from './ServiceRequestStatusEnum';
export type ServiceRequest = {
    readonly id: number;
    readonly user: number;
    request_type: RequestTypeEnum;
    description?: string;
    delivery_method?: DeliveryMethodEnum;
    readonly status: ServiceRequestStatusEnum;
    readonly admin_notes: string;
    readonly processed_by: number | null;
    readonly processed_at: string | null;
    readonly created_at: string;
    readonly updated_at: string;
};

