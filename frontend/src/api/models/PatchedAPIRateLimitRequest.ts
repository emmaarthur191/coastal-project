/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ActionOnLimitEnum } from './ActionOnLimitEnum';
import type { ScopeEnum } from './ScopeEnum';
import type { TimeUnitEnum } from './TimeUnitEnum';
/**
 * Serializer for API rate limiting configuration.
 */
export type PatchedAPIRateLimitRequest = {
    name?: string;
    description?: string;
    scope?: ScopeEnum;
    /**
     * Regex pattern for matching endpoints
     */
    endpoint_pattern?: string;
    methods?: any;
    requests_per_unit?: number;
    time_unit?: TimeUnitEnum;
    burst_limit?: number;
    action_on_limit?: ActionOnLimitEnum;
    block_duration?: number;
    exempt_users?: any;
    exempt_ips?: any;
    is_active?: boolean;
    created_by?: string | null;
};

