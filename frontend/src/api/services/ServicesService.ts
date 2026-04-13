/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PaginatedServiceRequestList } from '../models/PaginatedServiceRequestList';
import type { PatchedServiceRequest } from '../models/PatchedServiceRequest';
import type { ServiceRequest } from '../models/ServiceRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ServicesService {
    /**
     * ViewSet for handling service requests.
     * @param deliveryMethod * `email` - Email
     * * `sms` - SMS
     * * `pickup` - Branch Pickup
     * * `mail` - Postal Mail
     * @param ordering Which field to use when ordering the results.
     * @param page A page number within the paginated result set.
     * @param requestType * `statement` - Account Statement
     * * `checkbook` - Cheque Book
     * * `card_replacement` - Card Replacement
     * * `account_closure` - Account Closure
     * * `address_change` - Address Change
     * * `other` - Other
     * @param status * `pending` - Pending
     * * `processing` - Processing
     * * `completed` - Completed
     * * `rejected` - Rejected
     * * `cancelled` - Cancelled
     * @returns PaginatedServiceRequestList
     * @throws ApiError
     */
    public static servicesRequestsList(
        deliveryMethod?: 'email' | 'mail' | 'pickup' | 'sms',
        ordering?: string,
        page?: number,
        requestType?: 'account_closure' | 'address_change' | 'card_replacement' | 'checkbook' | 'other' | 'statement',
        status?: 'cancelled' | 'completed' | 'pending' | 'processing' | 'rejected',
    ): CancelablePromise<PaginatedServiceRequestList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/services/requests/',
            query: {
                'delivery_method': deliveryMethod,
                'ordering': ordering,
                'page': page,
                'request_type': requestType,
                'status': status,
            },
        });
    }
    /**
     * ViewSet for handling service requests.
     * @param requestBody
     * @returns ServiceRequest
     * @throws ApiError
     */
    public static servicesRequestsCreate(
        requestBody: ServiceRequest,
    ): CancelablePromise<ServiceRequest> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/services/requests/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for handling service requests.
     * @param id A unique integer value identifying this Service Request.
     * @returns ServiceRequest
     * @throws ApiError
     */
    public static servicesRequestsRetrieve(
        id: number,
    ): CancelablePromise<ServiceRequest> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/services/requests/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * ViewSet for handling service requests.
     * @param id A unique integer value identifying this Service Request.
     * @param requestBody
     * @returns ServiceRequest
     * @throws ApiError
     */
    public static servicesRequestsUpdate(
        id: number,
        requestBody: ServiceRequest,
    ): CancelablePromise<ServiceRequest> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/services/requests/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for handling service requests.
     * @param id A unique integer value identifying this Service Request.
     * @param requestBody
     * @returns ServiceRequest
     * @throws ApiError
     */
    public static servicesRequestsPartialUpdate(
        id: number,
        requestBody?: PatchedServiceRequest,
    ): CancelablePromise<ServiceRequest> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/services/requests/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Approve or reject a checkbook request (Operations Manager only).
     * @param id A unique integer value identifying this Service Request.
     * @param requestBody
     * @returns ServiceRequest
     * @throws ApiError
     */
    public static servicesRequestsApproveCheckbookCreate(
        id: number,
        requestBody: ServiceRequest,
    ): CancelablePromise<ServiceRequest> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/services/requests/{id}/approve-checkbook/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Staff action to process a service request.
     * @param id A unique integer value identifying this Service Request.
     * @param requestBody
     * @returns ServiceRequest
     * @throws ApiError
     */
    public static servicesRequestsProcessCreate(
        id: number,
        requestBody: ServiceRequest,
    ): CancelablePromise<ServiceRequest> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/services/requests/{id}/process/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get all pending checkbook requests for Operations Manager approval.
     * @returns ServiceRequest
     * @throws ApiError
     */
    public static servicesRequestsPendingCheckbooksRetrieve(): CancelablePromise<ServiceRequest> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/services/requests/pending-checkbooks/',
        });
    }
    /**
     * Retrieve aggregated statistics for service requests using database-level aggregation.
     * @returns any No response body
     * @throws ApiError
     */
    public static servicesStatsRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/services/stats/',
        });
    }
}
