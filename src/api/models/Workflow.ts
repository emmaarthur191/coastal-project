/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WorkflowStep } from './WorkflowStep';
export type Workflow = {
    readonly id: string;
    name: string;
    description?: string;
    created_by: string;
    readonly created_by_email: string;
    readonly created_at: string;
    readonly updated_at: string;
    is_active?: boolean;
    readonly steps: Array<WorkflowStep>;
};

