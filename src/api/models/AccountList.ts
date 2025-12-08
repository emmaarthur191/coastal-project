/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Serializer for account list display with frontend-compatible format.
 */
export type AccountList = {
    readonly id: string;
    /**
     * Return the full account number for display.
     */
    readonly account_number: string;
    name: string;
    balance: string;
    status?: string;
    created_at: string;
    /**
     * Return owner information in frontend-compatible format.
     */
    readonly owner: Record<string, string>;
};

