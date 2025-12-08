/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PurposeEnum } from './PurposeEnum';
import type { VisitScheduleStatusEnum } from './VisitScheduleStatusEnum';
export type PatchedVisitScheduleRequest = {
    client_name?: string;
    location?: string;
    scheduled_date?: string;
    scheduled_time?: string;
    purpose?: PurposeEnum;
    status?: VisitScheduleStatusEnum;
    assigned_to?: string;
    created_by?: string;
    notes?: string;
    completion_notes?: string;
    geotag?: string;
};

