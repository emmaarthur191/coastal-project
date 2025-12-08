/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Category996Enum } from './Category996Enum';
import type { StatusC7fEnum } from './StatusC7fEnum';
import type { TypeEnum } from './TypeEnum';
/**
 * Frontend-specific serializer for transaction list endpoints.
 * Maps 'timestamp' to 'date' with YYYY-MM-DD formatting and includes enhanced fields.
 */
export type TransactionList = {
    readonly id: string;
    readonly date: string;
    readonly description: string;
    readonly amount: string;
    readonly type: TypeEnum;
    readonly category: Category996Enum;
    readonly category_display: string;
    readonly status: StatusC7fEnum;
    readonly status_display: string;
    readonly tags: any;
    readonly reference_number: string;
};

