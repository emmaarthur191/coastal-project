/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ProductTypeEnum } from './ProductTypeEnum';
/**
 * Serializer for bank products.
 */
export type PatchedProduct = {
    readonly id?: number;
    name?: string;
    product_type?: ProductTypeEnum;
    readonly product_type_display?: string;
    description?: string;
    interest_rate?: string | null;
    minimum_balance?: string;
    maximum_balance?: string | null;
    features?: any;
    terms_and_conditions?: string;
    is_active?: boolean;
    readonly created_at?: string;
    readonly updated_at?: string;
};

