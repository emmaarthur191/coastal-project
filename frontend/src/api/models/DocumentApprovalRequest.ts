/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ActionEnum } from './ActionEnum';
/**
 * Serializer for document approval/rejection actions.
 */
export type DocumentApprovalRequest = {
    action: ActionEnum;
    rejection_reason?: string;
    review_notes?: string;
};

