/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BlankEnum } from './BlankEnum';
import type { ChartTypeEnum } from './ChartTypeEnum';
import type { NullEnum } from './NullEnum';
import type { WidgetTypeEnum } from './WidgetTypeEnum';
export type PatchedDashboardWidgetRequest = {
    name?: string;
    widget_type?: WidgetTypeEnum;
    chart_type?: (ChartTypeEnum | BlankEnum | NullEnum) | null;
    title?: string;
    description?: string;
    position_x?: number;
    position_y?: number;
    width?: number;
    height?: number;
    data_source?: string;
    metric_types?: any;
    filters?: any;
    time_range?: string;
    refresh_interval?: number;
    show_legend?: boolean;
    show_grid?: boolean;
    colors?: any;
    is_public?: boolean;
    shared_with?: any;
    is_active?: boolean;
    created_by?: string;
};

