/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RoleEnum } from './RoleEnum';
/**
 * Serializer for admin-side staff creation.
 * Allows setting role, phone_number, and staff_id.
 */
export type StaffCreation = {
    /**
     * Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.
     */
    username: string;
    email: string;
    password: string;
    password_confirm: string;
    readonly first_name: string;
    readonly last_name: string;
    role?: RoleEnum;
    phone_number?: string;
    readonly staff_id: string;
};

