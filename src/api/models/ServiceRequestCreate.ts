/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DeliveryMethod830Enum } from './DeliveryMethod830Enum';
import type { DeliveryMethodLoanEnum } from './DeliveryMethodLoanEnum';
import type { DeliveryMethodStatementEnum } from './DeliveryMethodStatementEnum';
import type { InfoTypeEnum } from './InfoTypeEnum';
import type { PriorityC93Enum } from './PriorityC93Enum';
import type { RequestType1e1Enum } from './RequestType1e1Enum';
import type { StatementTypeEnum } from './StatementTypeEnum';
/**
 * Serializer for creating service requests - determines which type to create.
 */
export type ServiceRequestCreate = {
    request_type: RequestType1e1Enum;
    member_id: string;
    priority?: PriorityC93Enum;
    notes?: string;
    quantity?: number;
    delivery_method?: DeliveryMethod830Enum;
    delivery_address?: string;
    special_instructions?: string;
    statement_type?: StatementTypeEnum;
    delivery_method_statement?: DeliveryMethodStatementEnum;
    start_date?: string;
    end_date?: string;
    account_number?: string;
    info_type?: InfoTypeEnum;
    delivery_method_loan?: DeliveryMethodLoanEnum;
    loan_account_number?: string;
};

