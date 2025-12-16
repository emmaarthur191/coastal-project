/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RoleEnum } from './RoleEnum';
export type PatchedUser = {
    readonly id?: number;
    /**
     * Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.
     */
    username?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    readonly name?: string;
    readonly role?: RoleEnum;
    /**
     * Designates whether this user should be treated as active. Unselect this instead of deleting accounts.
     */
    readonly is_active?: boolean;
    /**
     * Designates whether the user can log into this admin site.
     */
    readonly is_staff?: boolean;
    /**
     * Designates that this user has all permissions without explicitly assigning them.
     */
    readonly is_superuser?: boolean;
};

