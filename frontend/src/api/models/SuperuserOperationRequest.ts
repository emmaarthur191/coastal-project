/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OperationEnum } from './OperationEnum';
import type { SuperuserOperationRoleEnum } from './SuperuserOperationRoleEnum';
export type SuperuserOperationRequest = {
    operation: OperationEnum;
    reason: string;
    target?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    role?: SuperuserOperationRoleEnum;
    branch_name?: string;
    branch_location?: string;
    manager_id?: string;
    setting_key?: string;
    setting_value?: string;
};

