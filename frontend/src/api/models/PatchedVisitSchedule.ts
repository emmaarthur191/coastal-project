/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { VisitScheduleStatusEnum } from './VisitScheduleStatusEnum';
export type PatchedVisitSchedule = {
    readonly id?: number;
    readonly mobile_banker?: number;
    client_name?: string;
    location?: string;
    scheduled_time?: string;
    status?: VisitScheduleStatusEnum;
    notes?: string;
    readonly created_at?: string;
    readonly updated_at?: string;
};

