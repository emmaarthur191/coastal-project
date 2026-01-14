/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Complaint } from './Complaint';
export type PaginatedComplaintList = {
    count: number;
    next?: string | null;
    previous?: string | null;
    results: Array<Complaint>;
};
