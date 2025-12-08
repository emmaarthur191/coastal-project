/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CallLogStatusEnum } from './CallLogStatusEnum';
import type { CallTypeEnum } from './CallTypeEnum';
import type { User } from './User';
export type CallLog = {
    readonly id: string;
    thread: string;
    initiator: string;
    readonly participants: Array<User>;
    call_type: CallTypeEnum;
    status?: CallLogStatusEnum;
    readonly started_at: string | null;
    readonly ended_at: string | null;
    readonly duration: string | null;
    readonly created_at: string;
};

