/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PriorityC93Enum } from './PriorityC93Enum';
export type OperationsMessageRequest = {
    sender: string;
    recipient?: string | null;
    subject: string;
    content: string;
    priority?: PriorityC93Enum;
    is_read?: boolean;
    loan_application?: string | null;
};

