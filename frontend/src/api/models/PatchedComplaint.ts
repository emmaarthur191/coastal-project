/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CategoryEnum } from './CategoryEnum';
import type { ComplaintStatusEnum } from './ComplaintStatusEnum';
import type { PriorityE88Enum } from './PriorityE88Enum';
export type PatchedComplaint = {
    readonly id?: number;
    readonly user?: number;
    category?: CategoryEnum;
    priority?: PriorityE88Enum;
    subject?: string;
    description?: string;
    readonly status?: ComplaintStatusEnum;
    readonly resolution?: string;
    readonly assigned_to?: number | null;
    readonly resolved_by?: number | null;
    readonly resolved_at?: string | null;
    readonly created_at?: string;
    readonly updated_at?: string;
};

