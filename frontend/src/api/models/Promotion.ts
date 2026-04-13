/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Serializer for promotions.
 */
export type Promotion = {
    readonly id: number;
    name: string;
    description: string;
    discount_percentage?: string | null;
    bonus_amount?: string | null;
    start_date: string;
    end_date: string;
    is_active?: boolean;
    readonly is_currently_active: boolean;
    eligible_products?: Array<number>;
    readonly eligible_product_names: string;
    terms_and_conditions?: string;
    max_enrollments?: number | null;
    readonly current_enrollments: number;
    readonly created_at: string;
    readonly updated_at: string;
};

