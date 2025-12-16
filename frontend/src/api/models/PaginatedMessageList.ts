/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Message } from './Message';
export type PaginatedMessageList = {
    count: number;
    next?: string | null;
    previous?: string | null;
    results: Array<Message>;
};

