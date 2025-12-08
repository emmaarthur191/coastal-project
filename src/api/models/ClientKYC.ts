/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ClientKYC = {
    readonly id: string;
    client_name: string;
    client_id: string;
    readonly status: string;
    submitted_by: string;
    readonly submitted_by_email: string;
    readonly submitted_at: string;
    reviewed_by?: string | null;
    readonly reviewed_by_email: string;
    readonly reviewed_at: string | null;
    documents: any;
    geotag?: string;
    workflow?: string | null;
    readonly workflow_name: string;
};

