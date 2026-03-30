/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CategoryEnum } from './CategoryEnum';
import type { ComplaintStatusEnum } from './ComplaintStatusEnum';
import type { Priority5f3Enum } from './Priority5f3Enum';
export type Complaint = {
    readonly id: number;
    readonly user: number;
    category: CategoryEnum;
    priority?: Priority5f3Enum;
    subject: string;
    description: string;
    readonly status: ComplaintStatusEnum;
    readonly resolution: string;
    readonly assigned_to: number | null;
    readonly resolved_by: number | null;
    readonly resolved_at: string | null;
    readonly created_at: string;
    readonly updated_at: string;
};

