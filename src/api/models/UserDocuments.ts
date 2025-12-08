/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DocumentTypeEnum } from './DocumentTypeEnum';
import type { ReviewPriorityEnum } from './ReviewPriorityEnum';
import type { UserDocumentsStatusEnum } from './UserDocumentsStatusEnum';
/**
 * Serializer for user document management.
 */
export type UserDocuments = {
    readonly id: number;
    user: string;
    document_type: DocumentTypeEnum;
    file: string;
    readonly file_url: string;
    readonly uploaded_at: string;
    /**
     * File size in bytes
     */
    file_size: number;
    readonly file_size_mb: string;
    file_name: string;
    mime_type: string;
    status?: UserDocumentsStatusEnum;
    is_verified?: boolean;
    verified_by?: string | null;
    readonly verified_by_name: string;
    readonly verified_at: string | null;
    rejection_reason?: string | null;
    review_priority?: ReviewPriorityEnum;
    expiry_date?: string | null;
    /**
     * SHA-256 checksum for integrity
     */
    checksum?: string;
    readonly uploaded_by_name: string;
};

