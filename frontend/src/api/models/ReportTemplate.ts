/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ReportTypeEnum } from './ReportTypeEnum';
/**
 * Serializer for report templates.
 */
export type ReportTemplate = {
    readonly id: number;
    name: string;
    report_type: ReportTypeEnum;
    readonly report_type_display: string;
    description?: string;
    default_parameters?: any;
    is_active?: boolean;
    readonly created_at: string;
    readonly updated_at: string;
};

