/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ServiceRequest } from './ServiceRequest';
export type PaginatedServiceRequestList = {
    count: number;
    next?: string | null;
    previous?: string | null;
    results: Array<ServiceRequest>;
};
