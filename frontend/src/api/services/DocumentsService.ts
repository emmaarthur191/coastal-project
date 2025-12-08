/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UserDocuments } from '../models/UserDocuments';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DocumentsService {
    /**
     * Get Document Details
     * Retrieve details of a specific document.
     * @param id
     * @returns UserDocuments
     * @throws ApiError
     */
    public static usersDocumentsRetrieve(
        id: string,
    ): CancelablePromise<UserDocuments> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/users/documents/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Delete Document
     * Delete a specific document.
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static usersDocumentsDestroy(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/users/documents/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Get Document Details
     * Retrieve details of a specific document.
     * @param id
     * @returns UserDocuments
     * @throws ApiError
     */
    public static apiUsersDocumentsRetrieve(
        id: string,
    ): CancelablePromise<UserDocuments> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/documents/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Delete Document
     * Delete a specific document.
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static apiUsersDocumentsDestroy(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/users/documents/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
