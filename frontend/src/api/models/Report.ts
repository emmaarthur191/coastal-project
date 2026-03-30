/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FormatEnum } from './FormatEnum';
import type { ReportStatusEnum } from './ReportStatusEnum';
/**
 * Serializer for generated reports.
 */
export type Report = {
    readonly id: number;
    template?: number | null;
    readonly template_name: string;
    title: string;
    report_type: string;
    format?: FormatEnum;
    readonly format_display: string;
    status?: ReportStatusEnum;
    readonly status_display: string;
    readonly file_url: string;
    readonly report_url: string;
    readonly file_path: string;
    readonly file_size: number | null;
    readonly generated_by: number | null;
    readonly generated_by_name: string;
    parameters?: any;
    readonly error_message: string;
    readonly created_at: string;
    readonly completed_at: string | null;
};

