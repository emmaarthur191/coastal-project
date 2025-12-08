/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FormatEnum } from './FormatEnum';
import type { ReportStatusEnum } from './ReportStatusEnum';
/**
 * Serializer for Report model.
 */
export type ReportRequest = {
    template: string;
    title: string;
    description?: string;
    report_date?: string;
    start_date?: string | null;
    end_date?: string | null;
    filters_applied?: any;
    status?: ReportStatusEnum;
    format?: FormatEnum;
    expires_at?: string | null;
};

