/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChatMessage } from './ChatMessage';
export type PaginatedChatMessageList = {
    count: number;
    next?: string | null;
    previous?: string | null;
    results: Array<ChatMessage>;
};

