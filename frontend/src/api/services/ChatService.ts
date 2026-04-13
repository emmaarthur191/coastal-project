/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChatRoom } from '../models/ChatRoom';
import type { PaginatedChatMessageList } from '../models/PaginatedChatMessageList';
import type { PaginatedChatRoomList } from '../models/PaginatedChatRoomList';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ChatService {
    /**
     * GET /api/chat/rooms/
     * List all chat rooms for authenticated user.
     * @param page A page number within the paginated result set.
     * @returns PaginatedChatRoomList
     * @throws ApiError
     */
    public static chatRoomsList(
        page?: number,
    ): CancelablePromise<PaginatedChatRoomList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/chat/rooms/',
            query: {
                'page': page,
            },
        });
    }
    /**
     * GET /api/chat/rooms/<id>/
     * Get details of a specific chat room.
     * @param id
     * @returns ChatRoom
     * @throws ApiError
     */
    public static chatRoomsRetrieve(
        id: number,
    ): CancelablePromise<ChatRoom> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/chat/rooms/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * GET /api/chat/rooms/<room_id>/messages/
     * Get message history for a room.
     * @param roomId
     * @param page A page number within the paginated result set.
     * @returns PaginatedChatMessageList
     * @throws ApiError
     */
    public static chatRoomsMessagesList(
        roomId: number,
        page?: number,
    ): CancelablePromise<PaginatedChatMessageList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/chat/rooms/{room_id}/messages/',
            path: {
                'room_id': roomId,
            },
            query: {
                'page': page,
            },
        });
    }
    /**
     * POST /api/chat/rooms/<room_id>/messages/
     * Send a message via REST (fallback for WebSocket issues).
     * @param roomId
     * @returns any No response body
     * @throws ApiError
     */
    public static chatRoomsMessagesSendCreate(
        roomId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/chat/rooms/{room_id}/messages/send/',
            path: {
                'room_id': roomId,
            },
        });
    }
    /**
     * POST /api/chat/rooms/<room_id>/read/
     * Mark all messages in room as read for current user.
     * @param roomId
     * @returns any No response body
     * @throws ApiError
     */
    public static chatRoomsReadCreate(
        roomId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/chat/rooms/{room_id}/read/',
            path: {
                'room_id': roomId,
            },
        });
    }
    /**
     * POST /api/chat/rooms/
     * Create a new chat room (direct or group).
     * @returns any No response body
     * @throws ApiError
     */
    public static chatRoomsCreateCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/chat/rooms/create/',
        });
    }
}
