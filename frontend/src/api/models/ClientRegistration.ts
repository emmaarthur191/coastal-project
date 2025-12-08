/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ClientRegistrationStatusEnum } from './ClientRegistrationStatusEnum';
import type { IdTypeEnum } from './IdTypeEnum';
import type { NextOfKin } from './NextOfKin';
/**
 * Serializer for ClientRegistration model.
 */
export type ClientRegistration = {
    readonly id: string;
    readonly status: ClientRegistrationStatusEnum;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    phone_number: string;
    email?: string;
    id_type: IdTypeEnum;
    id_number: string;
    occupation: string;
    work_address: string;
    position: string;
    passport_picture?: string | null;
    readonly passport_picture_url: string;
    id_document?: string | null;
    readonly id_document_url: string;
    readonly next_of_kin: Array<NextOfKin>;
    readonly total_stake_percentage: number;
    readonly otp_sent_at: string | null;
    readonly otp_verified_at: string | null;
    readonly otp_attempts: number;
    readonly submitted_at: string | null;
    readonly reviewed_by: string | null;
    readonly reviewed_by_name: string;
    readonly reviewed_at: string | null;
    approval_notes?: string;
    readonly user_account: string | null;
    readonly bank_account: string | null;
    readonly ip_address: string | null;
    readonly user_agent: string;
    readonly created_at: string;
    readonly updated_at: string;
};

