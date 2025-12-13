/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type BankingMessage = {
    readonly id: number;
    user: number;
    subject: string;
    body: string;
    is_read?: boolean;
    readonly read_at: string | null;
    readonly thread_id: string | null;
    parent_message?: number | null;
    readonly replies: string;
    readonly created_at: string;
};

