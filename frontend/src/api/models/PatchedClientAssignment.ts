/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ClientAssignmentPriorityEnum } from './ClientAssignmentPriorityEnum';
import type { ClientAssignmentStatusEnum } from './ClientAssignmentStatusEnum';
/**
 * Serializer for client assignments to mobile bankers.
 */
export type PatchedClientAssignment = {
    readonly id?: number;
    mobile_banker?: number;
    readonly mobile_banker_name?: string;
    client?: number;
    client_name?: string;
    location?: string;
    status?: ClientAssignmentStatusEnum;
    readonly status_display?: string;
    amount_due?: string | null;
    readonly amount_due_formatted?: string;
    next_visit?: string | null;
    readonly next_visit_formatted?: string;
    priority?: ClientAssignmentPriorityEnum;
    readonly priority_display?: string;
    notes?: string;
    is_active?: boolean;
    readonly created_at?: string;
    readonly updated_at?: string;
};

