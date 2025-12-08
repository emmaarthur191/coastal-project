/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DeliveryMethod830Enum } from './DeliveryMethod830Enum';
import type { PriorityC93Enum } from './PriorityC93Enum';
import type { RequestType1e1Enum } from './RequestType1e1Enum';
import type { Status6fbEnum } from './Status6fbEnum';
/**
 * Serializer for checkbook requests.
 */
export type CheckbookRequestRequest = {
    /**
     * Member requesting the service
     */
    member: string;
    /**
     * Staff member who created the request
     */
    requested_by: string;
    request_type: RequestType1e1Enum;
    status?: Status6fbEnum;
    priority?: PriorityC93Enum;
    /**
     * Additional notes or comments
     */
    notes?: string;
    fee_amount?: string;
    fee_paid?: boolean;
    /**
     * Number of checkbooks requested
     */
    quantity?: number;
    delivery_method?: DeliveryMethod830Enum;
    /**
     * Delivery address if not pickup
     */
    delivery_address?: string;
    /**
     * Special printing instructions
     */
    special_instructions?: string;
};

