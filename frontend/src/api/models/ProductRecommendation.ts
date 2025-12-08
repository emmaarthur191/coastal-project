/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Product } from './Product';
import type { ProductRecommendationRecommendationTypeEnum } from './ProductRecommendationRecommendationTypeEnum';
export type ProductRecommendation = {
    readonly id: string;
    readonly product_details: Product;
    readonly customer_email: string;
    recommendation_type: ProductRecommendationRecommendationTypeEnum;
    priority_score?: number;
    reasoning?: string;
    transaction_context?: any;
    customer_profile?: any;
    is_viewed?: boolean;
    is_interested?: boolean | null;
    is_applied?: boolean;
    applied_at?: string | null;
    readonly created_at: string;
    readonly updated_at: string;
    customer: string;
    product: string;
};

