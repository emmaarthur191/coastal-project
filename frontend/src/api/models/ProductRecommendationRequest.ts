/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ProductRecommendationRecommendationTypeEnum } from './ProductRecommendationRecommendationTypeEnum';
export type ProductRecommendationRequest = {
    recommendation_type: ProductRecommendationRecommendationTypeEnum;
    priority_score?: number;
    reasoning?: string;
    transaction_context?: any;
    customer_profile?: any;
    is_viewed?: boolean;
    is_interested?: boolean | null;
    is_applied?: boolean;
    applied_at?: string | null;
    customer: string;
    product: string;
};

