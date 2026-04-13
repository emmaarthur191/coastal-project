/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { VerificationTypeEnum } from './VerificationTypeEnum';
/**
 * Serializer for requesting an SMS OTP.
 */
export type OTPRequest = {
    phone_number: string;
    verification_type?: VerificationTypeEnum;
};

