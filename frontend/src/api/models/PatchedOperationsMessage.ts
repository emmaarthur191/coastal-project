/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OperationsMessagePriorityEnum } from './OperationsMessagePriorityEnum';
export type PatchedOperationsMessage = {
    readonly id?: number;
    readonly sender?: number;
    readonly sender_name?: string;
    recipient?: number | null;
    title?: string;
    message?: string;
    priority?: OperationsMessagePriorityEnum;
    is_read?: boolean;
    readonly created_at?: string;
};

