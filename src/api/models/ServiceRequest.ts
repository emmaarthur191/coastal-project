/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PriorityC93Enum } from './PriorityC93Enum';
import type { RequestType1e1Enum } from './RequestType1e1Enum';
import type { Status6fbEnum } from './Status6fbEnum';
/**
 * Base serializer for service requests.
 */
export type ServiceRequest = {
    readonly id: string;
    /**
     * Member requesting the service
     */
    member: string;
    readonly member_name: string;
    /**
     * Staff member who created the request
     */
    requested_by: string;
    readonly requested_by_name: string;
    request_type: RequestType1e1Enum;
    status?: Status6fbEnum;
    priority?: PriorityC93Enum;
    /**
     * Additional notes or comments
     */
    notes?: string;
    readonly created_at: string;
    readonly updated_at: string;
    readonly approved_by: string | null;
    readonly approved_by_name: string | null;
    readonly approved_at: string | null;
    readonly fulfilled_by: string | null;
    readonly fulfilled_by_name: string | null;
    readonly fulfilled_at: string | null;
    fee_amount?: string;
    fee_paid?: boolean;
    readonly fee_paid_at: string | null;
};

