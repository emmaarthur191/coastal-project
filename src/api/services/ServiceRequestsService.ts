/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ServiceRequestRequest } from '../models/ServiceRequestRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ServiceRequestsService {
    /**
     * List Service Requests
     * Get all service requests for the authenticated user.
     * @returns any
     * @throws ApiError
     */
    public static usersServiceRequestsRetrieve(): CancelablePromise<Array<{
        id?: string;
        request_type?: string;
        description?: string;
        delivery_method?: string;
        status?: string;
        created_at?: string;
    }>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/users/service-requests/',
        });
    }
    /**
     * Create Service Request
     * Create a new service request for the authenticated user.
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static usersServiceRequestsCreate(
        requestBody: ServiceRequestRequest,
    ): CancelablePromise<{
        message?: string;
        request_id?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/users/service-requests/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * List Service Requests
     * Get all service requests for the authenticated user.
     * @returns any
     * @throws ApiError
     */
    public static apiUsersServiceRequestsRetrieve(): CancelablePromise<Array<{
        id?: string;
        request_type?: string;
        description?: string;
        delivery_method?: string;
        status?: string;
        created_at?: string;
    }>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/service-requests/',
        });
    }
    /**
     * Create Service Request
     * Create a new service request for the authenticated user.
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static apiUsersServiceRequestsCreate(
        requestBody: ServiceRequestRequest,
    ): CancelablePromise<{
        message?: string;
        request_id?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/service-requests/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
