/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DocumentApprovalRequest } from '../models/DocumentApprovalRequest';
import type { UserDocuments } from '../models/UserDocuments';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DocumentsService {
    /**
     * List User Documents
     * Retrieve all documents uploaded by the authenticated user.
     * @returns UserDocuments
     * @throws ApiError
     */
    public static usersDocumentsList(): CancelablePromise<Array<UserDocuments>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/users/documents/',
        });
    }
    /**
     * Upload Document
     * Upload a new document for the authenticated user.
     * @param formData
     * @returns UserDocuments
     * @throws ApiError
     */
    public static usersDocumentsCreate(
        formData?: {
            document_type: 'passport_picture' | 'application_letter' | 'appointment_letter' | 'id_card' | 'utility_bill' | 'bank_statement' | 'other';
            file: Blob | File;
            expiry_date?: string | null;
        },
    ): CancelablePromise<UserDocuments> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/users/documents/',
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
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
     * Approve/Reject Document
     * Approve or reject a document submission.
     * @param id
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static usersDocumentsApproveCreate(
        id: string,
        requestBody: DocumentApprovalRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/users/documents/{id}/approve/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * List Pending Documents
     * Retrieve all documents pending approval.
     * @returns UserDocuments
     * @throws ApiError
     */
    public static usersDocumentsPendingList(): CancelablePromise<Array<UserDocuments>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/users/documents/pending/',
        });
    }
    /**
     * List User Documents
     * Retrieve all documents uploaded by the authenticated user.
     * @returns UserDocuments
     * @throws ApiError
     */
    public static apiUsersDocumentsList(): CancelablePromise<Array<UserDocuments>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/documents/',
        });
    }
    /**
     * Upload Document
     * Upload a new document for the authenticated user.
     * @param formData
     * @returns UserDocuments
     * @throws ApiError
     */
    public static apiUsersDocumentsCreate(
        formData?: {
            document_type: 'passport_picture' | 'application_letter' | 'appointment_letter' | 'id_card' | 'utility_bill' | 'bank_statement' | 'other';
            file: Blob | File;
            expiry_date?: string | null;
        },
    ): CancelablePromise<UserDocuments> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/documents/',
            formData: formData,
            mediaType: 'multipart/form-data',
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
    /**
     * Approve/Reject Document
     * Approve or reject a document submission.
     * @param id
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static apiUsersDocumentsApproveCreate(
        id: string,
        requestBody: DocumentApprovalRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/documents/{id}/approve/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * List Pending Documents
     * Retrieve all documents pending approval.
     * @returns UserDocuments
     * @throws ApiError
     */
    public static apiUsersDocumentsPendingList(): CancelablePromise<Array<UserDocuments>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/documents/pending/',
        });
    }
}
