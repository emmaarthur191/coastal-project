/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MetricTypeEnum } from './MetricTypeEnum';
export type PerformanceMetricRequest = {
    metric_type: MetricTypeEnum;
    metric_name: string;
    value: string;
    unit?: string;
    service_name?: string;
    endpoint?: string;
    tags?: any;
    metadata?: any;
    user?: string | null;
};

