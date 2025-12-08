/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PriorityC93Enum } from './PriorityC93Enum';
import type { Status6fbEnum } from './Status6fbEnum';
/**
 * Serializer for updating service request status and notes.
 */
export type PatchedServiceRequestUpdateRequest = {
    status?: Status6fbEnum;
    priority?: PriorityC93Enum;
    notes?: string;
    rejection_reason?: string;
};

