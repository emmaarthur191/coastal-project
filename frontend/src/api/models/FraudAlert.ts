/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SeverityEnum } from './SeverityEnum';
export type FraudAlert = {
    readonly id: number;
    user: number;
    message: string;
    severity?: SeverityEnum;
    is_resolved?: boolean;
    readonly resolved_at: string | null;
    readonly created_at: string;
};

