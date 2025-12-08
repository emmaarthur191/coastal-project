/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FormatEnum } from './FormatEnum';
import type { ReportStatusEnum } from './ReportStatusEnum';
/**
 * Serializer for Report model.
 */
export type Report = {
    readonly id: string;
    template: string;
    readonly template_name: string;
    title: string;
    description?: string;
    report_date?: string;
    start_date?: string | null;
    end_date?: string | null;
    filters_applied?: any;
    status?: ReportStatusEnum;
    readonly status_display: string;
    format?: FormatEnum;
    readonly format_display: string;
    readonly generated_by: string | null;
    readonly generated_by_name: string;
    readonly generated_at: string | null;
    readonly completed_at: string | null;
    readonly data: any;
    readonly file_path: string;
    readonly file_size: number | null;
    readonly error_message: string;
    readonly created_at: string;
    expires_at?: string | null;
};

