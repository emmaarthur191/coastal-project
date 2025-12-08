/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class StaffRegistrationService {
    /**
     * Enhanced Staff Registration
     * Create a new staff member with complete profile, banking details, and required documents. Only accessible by managers and operations managers.
     * @param formData
     * @returns any
     * @throws ApiError
     */
    public static usersStaffRegisterCreate(
        formData?: {
            email: string;
            first_name: string;
            last_name: string;
            phone: string;
            role: 'cashier' | 'mobile_banker' | 'manager' | 'operations_manager' | 'administrator';
            password: string;
            house_address: string;
            contact_address?: string;
            government_id: string;
            ssnit_number: string;
            bank_name: string;
            account_number: string;
            branch_code: string;
            routing_number: string;
            passport_picture: ;
            application_letter: ;
            appointment_letter: ;
        },
    ): CancelablePromise<{
        message?: string;
        user?: {
            id?: string;
            email?: string;
            first_name?: string;
            last_name?: string;
            role?: string;
        };
        documents_created?: number;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/users/staff/register/',
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * Enhanced Staff Registration
     * Create a new staff member with complete profile, banking details, and required documents. Only accessible by managers and operations managers.
     * @param formData
     * @returns any
     * @throws ApiError
     */
    public static apiUsersStaffRegisterCreate(
        formData?: {
            email: string;
            first_name: string;
            last_name: string;
            phone: string;
            role: 'cashier' | 'mobile_banker' | 'manager' | 'operations_manager' | 'administrator';
            password: string;
            house_address: string;
            contact_address?: string;
            government_id: string;
            ssnit_number: string;
            bank_name: string;
            account_number: string;
            branch_code: string;
            routing_number: string;
            passport_picture: ;
            application_letter: ;
            appointment_letter: ;
        },
    ): CancelablePromise<{
        message?: string;
        user?: {
            id?: string;
            email?: string;
            first_name?: string;
            last_name?: string;
            role?: string;
        };
        documents_created?: number;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/staff/register/',
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
}
