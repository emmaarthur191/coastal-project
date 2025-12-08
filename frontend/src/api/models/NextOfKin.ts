/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RelationshipEnum } from './RelationshipEnum';
/**
 * Serializer for NextOfKin model.
 */
export type NextOfKin = {
    readonly id: number;
    name: string;
    relationship: RelationshipEnum;
    address: string;
    stake_percentage: string;
    readonly created_at: string;
    readonly updated_at: string;
};

