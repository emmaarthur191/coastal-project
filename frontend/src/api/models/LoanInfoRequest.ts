/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DeliveryMethod050Enum } from './DeliveryMethod050Enum';
import type { InfoTypeEnum } from './InfoTypeEnum';
import type { PriorityC93Enum } from './PriorityC93Enum';
import type { RequestType1e1Enum } from './RequestType1e1Enum';
import type { Status6fbEnum } from './Status6fbEnum';
/**
 * Serializer for loan information requests.
 */
export type LoanInfoRequest = {
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
    info_type: InfoTypeEnum;
    delivery_method?: DeliveryMethod050Enum;
    /**
     * Loan account number
     */
    loan_account_number: string;
    readonly authorization_verified: boolean;
    readonly verified_by: string | null;
    readonly verified_by_name: string | null;
    readonly verified_at: string | null;
    readonly info_delivered: boolean;
    readonly delivered_at: string | null;
    /**
     * Notes about information delivery
     */
    delivery_notes?: string;
};

