/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FrequencyEnum } from './FrequencyEnum';
import type { TemplateTypeEnum } from './TemplateTypeEnum';
/**
 * Serializer for ReportTemplate model.
 */
export type PatchedReportTemplateRequest = {
    name?: string;
    description?: string;
    template_type?: TemplateTypeEnum;
    frequency?: FrequencyEnum;
    layout_config?: any;
    filters_config?: any;
    columns_config?: any;
    charts_config?: any;
    is_active?: boolean;
};

