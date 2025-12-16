/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Serializer for blocked users.
 */
export type BlockedUser = {
    readonly id: number;
    readonly blocker: number;
    blocked: number;
    readonly blocker_username: string;
    readonly blocked_username: string;
    readonly blocked_full_name: string;
    reason?: string;
    readonly created_at: string;
};

