/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { VerificationTypeEnum } from './VerificationTypeEnum';
export type OTPVerifyRequest = {
    phone_number: string;
    otp_code: string;
    verification_type?: VerificationTypeEnum;
};

