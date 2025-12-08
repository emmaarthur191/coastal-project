/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BackupTypeEnum } from './BackupTypeEnum';
import type { MessageBackupStatusEnum } from './MessageBackupStatusEnum';
export type MessageBackup = {
    readonly id: string;
    backup_type?: BackupTypeEnum;
    status?: MessageBackupStatusEnum;
    readonly file_path: string | null;
    readonly file_size: number | null;
    readonly message_count: number;
    readonly media_count: number;
    readonly checksum: string | null;
    readonly created_at: string;
    readonly completed_at: string | null;
};

