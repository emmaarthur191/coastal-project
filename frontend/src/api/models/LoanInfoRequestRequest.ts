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
export type LoanInfoRequestRequest = {
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
    info_type: InfoTypeEnum;
    delivery_method?: DeliveryMethod050Enum;
    /**
     * Loan account number
     */
    loan_account_number: string;
    /**
     * Notes about information delivery
     */
    delivery_notes?: string;
};

