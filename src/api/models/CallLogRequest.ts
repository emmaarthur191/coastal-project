/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CallLogStatusEnum } from './CallLogStatusEnum';
import type { CallTypeEnum } from './CallTypeEnum';
export type CallLogRequest = {
    thread: string;
    initiator: string;
    call_type: CallTypeEnum;
    status?: CallLogStatusEnum;
};

