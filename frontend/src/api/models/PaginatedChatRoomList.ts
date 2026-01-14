/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChatRoom } from './ChatRoom';
export type PaginatedChatRoomList = {
    count: number;
    next?: string | null;
    previous?: string | null;
    results: Array<ChatRoom>;
};
