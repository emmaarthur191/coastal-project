/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ServiceRequestDeliveryMethodEnum } from './ServiceRequestDeliveryMethodEnum';
import type { ServiceRequestRequestTypeEnum } from './ServiceRequestRequestTypeEnum';
export type ServiceRequestRequest = {
    request_type: ServiceRequestRequestTypeEnum;
    description?: string;
    delivery_method: ServiceRequestDeliveryMethodEnum;
};

