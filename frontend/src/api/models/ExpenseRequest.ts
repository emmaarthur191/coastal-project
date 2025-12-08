/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ExpenseCategoryEnum } from './ExpenseCategoryEnum';
export type ExpenseRequest = {
    category: ExpenseCategoryEnum;
    description: string;
    amount: string;
    date_incurred: string;
    recorded_by: string;
    receipt_url?: string | null;
    approved_by?: string | null;
    is_approved?: boolean;
};

