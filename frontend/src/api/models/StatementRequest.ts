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
export type StatementRequest = {
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
    readonly email_sent: boolean;
    readonly email_sent_at: string | null;
    readonly mailed: boolean;
    readonly mailed_at: string | null;
    readonly tracking_number: string;
};

