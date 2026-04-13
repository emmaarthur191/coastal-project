/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PaginatedProductList } from '../models/PaginatedProductList';
import type { PaginatedPromotionList } from '../models/PaginatedPromotionList';
import type { PatchedProduct } from '../models/PatchedProduct';
import type { PatchedPromotion } from '../models/PatchedPromotion';
import type { Product } from '../models/Product';
import type { Promotion } from '../models/Promotion';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ProductsService {
    /**
     * Return the list of all products.
     * @param isActive
     * @param ordering Which field to use when ordering the results.
     * @param page A page number within the paginated result set.
     * @param productType * `savings` - Savings Account
     * * `loan` - Loan
     * * `insurance` - Insurance
     * * `investment` - Investment
     * * `susu` - Susu Account
     * @returns PaginatedProductList
     * @throws ApiError
     */
    public static productsProductsList(
        isActive?: boolean,
        ordering?: string,
        page?: number,
        productType?: 'insurance' | 'investment' | 'loan' | 'savings' | 'susu',
    ): CancelablePromise<PaginatedProductList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/products/products/',
            query: {
                'is_active': isActive,
                'ordering': ordering,
                'page': page,
                'product_type': productType,
            },
        });
    }
    /**
     * ViewSet for managing bank products.
     * @param requestBody
     * @returns Product
     * @throws ApiError
     */
    public static productsProductsCreate(
        requestBody: Product,
    ): CancelablePromise<Product> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/products/products/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing bank products.
     * @param id A unique integer value identifying this Product.
     * @returns Product
     * @throws ApiError
     */
    public static productsProductsRetrieve(
        id: number,
    ): CancelablePromise<Product> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/products/products/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * ViewSet for managing bank products.
     * @param id A unique integer value identifying this Product.
     * @param requestBody
     * @returns Product
     * @throws ApiError
     */
    public static productsProductsUpdate(
        id: number,
        requestBody: Product,
    ): CancelablePromise<Product> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/products/products/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing bank products.
     * @param id A unique integer value identifying this Product.
     * @param requestBody
     * @returns Product
     * @throws ApiError
     */
    public static productsProductsPartialUpdate(
        id: number,
        requestBody?: PatchedProduct,
    ): CancelablePromise<Product> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/products/products/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing bank products.
     * @param id A unique integer value identifying this Product.
     * @returns void
     * @throws ApiError
     */
    public static productsProductsDestroy(
        id: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/products/products/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Return the list of all promotional offers.
     * @param isActive
     * @param ordering Which field to use when ordering the results.
     * @param page A page number within the paginated result set.
     * @returns PaginatedPromotionList
     * @throws ApiError
     */
    public static productsPromotionsList(
        isActive?: boolean,
        ordering?: string,
        page?: number,
    ): CancelablePromise<PaginatedPromotionList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/products/promotions/',
            query: {
                'is_active': isActive,
                'ordering': ordering,
                'page': page,
            },
        });
    }
    /**
     * ViewSet for managing promotions.
     * @param requestBody
     * @returns Promotion
     * @throws ApiError
     */
    public static productsPromotionsCreate(
        requestBody: Promotion,
    ): CancelablePromise<Promotion> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/products/promotions/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing promotions.
     * @param id A unique integer value identifying this Promotion.
     * @returns Promotion
     * @throws ApiError
     */
    public static productsPromotionsRetrieve(
        id: number,
    ): CancelablePromise<Promotion> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/products/promotions/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * ViewSet for managing promotions.
     * @param id A unique integer value identifying this Promotion.
     * @param requestBody
     * @returns Promotion
     * @throws ApiError
     */
    public static productsPromotionsUpdate(
        id: number,
        requestBody: Promotion,
    ): CancelablePromise<Promotion> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/products/promotions/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing promotions.
     * @param id A unique integer value identifying this Promotion.
     * @param requestBody
     * @returns Promotion
     * @throws ApiError
     */
    public static productsPromotionsPartialUpdate(
        id: number,
        requestBody?: PatchedPromotion,
    ): CancelablePromise<Promotion> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/products/promotions/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing promotions.
     * @param id A unique integer value identifying this Promotion.
     * @returns void
     * @throws ApiError
     */
    public static productsPromotionsDestroy(
        id: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/products/promotions/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Enroll customer in a promotion.
     * @param id A unique integer value identifying this Promotion.
     * @param requestBody
     * @returns Promotion
     * @throws ApiError
     */
    public static productsPromotionsEnrollCreate(
        id: number,
        requestBody: Promotion,
    ): CancelablePromise<Promotion> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/products/promotions/{id}/enroll/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get currently active promotions.
     * @returns Promotion
     * @throws ApiError
     */
    public static productsPromotionsActiveRetrieve(): CancelablePromise<Promotion> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/products/promotions/active/',
        });
    }
}
