/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PurposeEnum } from './PurposeEnum';
import type { VisitScheduleStatusEnum } from './VisitScheduleStatusEnum';
export type VisitSchedule = {
    readonly id: string;
    client_name: string;
    location: string;
    scheduled_date: string;
    scheduled_time: string;
    readonly scheduled_datetime: string;
    purpose: PurposeEnum;
    status?: VisitScheduleStatusEnum;
    assigned_to: string;
    readonly assigned_to_name: string;
    created_by: string;
    readonly created_by_name: string;
    readonly created_at: string;
    readonly updated_at: string;
    notes?: string;
    readonly actual_start_time: string | null;
    readonly actual_end_time: string | null;
    completion_notes?: string;
    geotag?: string;
};

