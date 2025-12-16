/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UserMini } from './UserMini';
export type ChatRoom = {
    readonly id: number;
    name?: string | null;
    is_group?: boolean;
    readonly members: Array<UserMini>;
    readonly display_name: string;
    readonly last_message: string;
    readonly unread_count: string;
    readonly created_at: string;
    readonly updated_at: string;
};

