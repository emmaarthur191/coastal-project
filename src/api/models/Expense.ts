/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ExpenseCategoryEnum } from './ExpenseCategoryEnum';
export type Expense = {
    readonly id: string;
    category: ExpenseCategoryEnum;
    description: string;
    amount: string;
    date_incurred: string;
    recorded_by: string;
    readonly recorded_by_name: string;
    readonly created_at: string;
    readonly updated_at: string;
    receipt_url?: string | null;
    approved_by?: string | null;
    readonly approved_by_name: string;
    is_approved?: boolean;
};

