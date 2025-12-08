/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { IdTypeEnum } from './IdTypeEnum';
/**
 * Serializer for ClientRegistration model.
 */
export type PatchedClientRegistrationRequest = {
    first_name?: string;
    last_name?: string;
    date_of_birth?: string;
    phone_number?: string;
    email?: string;
    id_type?: IdTypeEnum;
    id_number?: string;
    occupation?: string;
    work_address?: string;
    position?: string;
    passport_picture?:  | null;
    id_document?:  | null;
    /**
     * List of next of kin data (max 4)
     */
    next_of_kin_data?: Array<Record<string, any>>;
    approval_notes?: string;
};

