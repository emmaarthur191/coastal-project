/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MlService {
    /**
     * Analyze a transaction for potential fraud.
     * @returns any No response body
     * @throws ApiError
     */
    public static mlFraudAnalyzeCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/ml/fraud/analyze/',
        });
    }
    /**
     * Trigger batch fraud analysis.
     * @returns any No response body
     * @throws ApiError
     */
    public static mlFraudBatchAnalyzeCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/ml/fraud/batch-analyze/',
        });
    }
    /**
     * Get model status and metrics.
     * @returns any No response body
     * @throws ApiError
     */
    public static mlFraudModelStatusRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/ml/fraud/model/status/',
        });
    }
    /**
     * Trigger model retraining.
     * @returns any No response body
     * @throws ApiError
     */
    public static mlFraudModelTrainCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/ml/fraud/model/train/',
        });
    }
}
