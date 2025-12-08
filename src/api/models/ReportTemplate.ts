/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FrequencyEnum } from './FrequencyEnum';
import type { TemplateTypeEnum } from './TemplateTypeEnum';
/**
 * Serializer for ReportTemplate model.
 */
export type ReportTemplate = {
    readonly id: string;
    name: string;
    description?: string;
    template_type: TemplateTypeEnum;
    frequency?: FrequencyEnum;
    layout_config?: any;
    filters_config?: any;
    columns_config?: any;
    charts_config?: any;
    readonly created_by: string;
    readonly created_by_name: string;
    readonly created_at: string;
    readonly updated_at: string;
    is_active?: boolean;
};

