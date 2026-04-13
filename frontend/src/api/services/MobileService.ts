/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MobileService {
    /**
     * Standalone view for mobile bankers to process loan repayments.
     * @returns any No response body
     * @throws ApiError
     */
    public static mobileRepaymentCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/mobile/repayment/',
        });
    }
}
