/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PriorityC93Enum } from './PriorityC93Enum';
export type OperationsMessage = {
    readonly id: string;
    sender: string;
    readonly sender_name: string;
    recipient?: string | null;
    readonly recipient_name: string;
    subject: string;
    content: string;
    priority?: PriorityC93Enum;
    is_read?: boolean;
    readonly created_at: string;
    readonly read_at: string | null;
    loan_application?: string | null;
};

