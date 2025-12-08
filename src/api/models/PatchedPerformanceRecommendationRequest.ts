/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PerformanceRecommendationRecommendationTypeEnum } from './PerformanceRecommendationRecommendationTypeEnum';
import type { PerformanceRecommendationStatusEnum } from './PerformanceRecommendationStatusEnum';
import type { SeverityEnum } from './SeverityEnum';
export type PatchedPerformanceRecommendationRequest = {
    title?: string;
    description?: string;
    recommendation_type?: PerformanceRecommendationRecommendationTypeEnum;
    priority?: SeverityEnum;
    status?: PerformanceRecommendationStatusEnum;
    analysis_data?: any;
    metrics_snapshot?: any;
    estimated_impact?: string;
    implementation_effort?: string;
    cost_benefit_ratio?: string | null;
    implementation_notes?: string;
    tags?: any;
    assigned_to?: string | null;
    implemented_by?: string | null;
};

