/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FraudAlert } from './FraudAlert';
export type PaginatedFraudAlertList = {
    count: number;
    next?: string | null;
    previous?: string | null;
    results: Array<FraudAlert>;
};

