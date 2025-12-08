/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MethodEnum } from './MethodEnum';
/**
 * Serializer for API usage tracking.
 */
export type APIUsage = {
    readonly id: string;
    readonly user_email: string;
    readonly user_role: string;
    endpoint: string;
    method: MethodEnum;
    ip_address: string;
    user_agent?: string;
    request_size?: number;
    response_size?: number;
    status_code: number;
    response_time?: string | null;
    error_message?: string;
    api_version?: string;
    session_id?: string;
    readonly timestamp: string;
    user: string;
};

