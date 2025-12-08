/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ThreadTypeEnum } from './ThreadTypeEnum';
export type CreateMessageThreadRequest = {
    subject: string;
    description?: string | null;
    thread_type?: ThreadTypeEnum;
    participants: Array<string>;
    initial_message?: string;
};

