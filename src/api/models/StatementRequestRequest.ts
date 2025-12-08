/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DeliveryMethodB56Enum } from './DeliveryMethodB56Enum';
import type { PriorityC93Enum } from './PriorityC93Enum';
import type { RequestType1e1Enum } from './RequestType1e1Enum';
import type { StatementTypeEnum } from './StatementTypeEnum';
import type { Status6fbEnum } from './Status6fbEnum';
/**
 * Serializer for statement requests.
 */
export type StatementRequestRequest = {
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
    statement_type?: StatementTypeEnum;
    delivery_method?: DeliveryMethodB56Enum;
    /**
     * Start date for custom statements
     */
    start_date?: string | null;
    /**
     * End date for custom statements
     */
    end_date?: string | null;
    /**
     * Specific account number
     */
    account_number?: string;
};

