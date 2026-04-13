/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PaginatedReportList } from '../models/PaginatedReportList';
import type { PaginatedReportScheduleList } from '../models/PaginatedReportScheduleList';
import type { PaginatedReportTemplateList } from '../models/PaginatedReportTemplateList';
import type { PatchedReportSchedule } from '../models/PatchedReportSchedule';
import type { Report } from '../models/Report';
import type { ReportSchedule } from '../models/ReportSchedule';
import type { ReportTemplate } from '../models/ReportTemplate';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ReportsService {
    /**
     * ViewSet for managing generated reports.
     * @param format * `pdf` - PDF
     * * `csv` - CSV
     * * `docx` - Word Document
     * * `xlsx` - Excel
     * @param ordering Which field to use when ordering the results.
     * @param page A page number within the paginated result set.
     * @param reportType
     * @param status * `pending` - Pending
     * * `generating` - Generating
     * * `completed` - Completed
     * * `failed` - Failed
     * @returns PaginatedReportList
     * @throws ApiError
     */
    public static reportsList(
        format?: 'csv' | 'docx' | 'pdf' | 'xlsx',
        ordering?: string,
        page?: number,
        reportType?: string,
        status?: 'completed' | 'failed' | 'generating' | 'pending',
    ): CancelablePromise<PaginatedReportList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/reports/',
            query: {
                'format': format,
                'ordering': ordering,
                'page': page,
                'report_type': reportType,
                'status': status,
            },
        });
    }
    /**
     * ViewSet for managing generated reports.
     * @param requestBody
     * @returns Report
     * @throws ApiError
     */
    public static reportsCreate(
        requestBody: Report,
    ): CancelablePromise<Report> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/reports/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing generated reports.
     * @param id A unique integer value identifying this Report.
     * @returns Report
     * @throws ApiError
     */
    public static reportsRetrieve(
        id: number,
    ): CancelablePromise<Report> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/reports/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Retrieve aggregated report analytics data.
     * @returns any No response body
     * @throws ApiError
     */
    public static reportsAnalyticsRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/reports/analytics/',
        });
    }
    /**
     * View to download generated reports.
     * @param reportId
     * @returns any No response body
     * @throws ApiError
     */
    public static reportsDownloadRetrieve(
        reportId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/reports/download/{report_id}/',
            path: {
                'report_id': reportId,
            },
        });
    }
    /**
     * Generate a report from a template.
     * @param requestBody
     * @returns Report
     * @throws ApiError
     */
    public static reportsGenerateCreate(
        requestBody: Report,
    ): CancelablePromise<Report> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/reports/generate/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing generated reports.
     * @param format * `pdf` - PDF
     * * `csv` - CSV
     * * `docx` - Word Document
     * * `xlsx` - Excel
     * @param ordering Which field to use when ordering the results.
     * @param page A page number within the paginated result set.
     * @param reportType
     * @param status * `pending` - Pending
     * * `generating` - Generating
     * * `completed` - Completed
     * * `failed` - Failed
     * @returns PaginatedReportList
     * @throws ApiError
     */
    public static reportsReportsList(
        format?: 'csv' | 'docx' | 'pdf' | 'xlsx',
        ordering?: string,
        page?: number,
        reportType?: string,
        status?: 'completed' | 'failed' | 'generating' | 'pending',
    ): CancelablePromise<PaginatedReportList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/reports/reports/',
            query: {
                'format': format,
                'ordering': ordering,
                'page': page,
                'report_type': reportType,
                'status': status,
            },
        });
    }
    /**
     * ViewSet for managing generated reports.
     * @param requestBody
     * @returns Report
     * @throws ApiError
     */
    public static reportsReportsCreate(
        requestBody: Report,
    ): CancelablePromise<Report> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/reports/reports/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing generated reports.
     * @param id A unique integer value identifying this Report.
     * @returns Report
     * @throws ApiError
     */
    public static reportsReportsRetrieve(
        id: number,
    ): CancelablePromise<Report> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/reports/reports/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Generate a report from a template.
     * @param requestBody
     * @returns Report
     * @throws ApiError
     */
    public static reportsReportsGenerateCreate(
        requestBody: Report,
    ): CancelablePromise<Report> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/reports/reports/generate/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing report schedules.
     * @param frequency * `daily` - Daily
     * * `weekly` - Weekly
     * * `monthly` - Monthly
     * * `quarterly` - Quarterly
     * @param isActive
     * @param ordering Which field to use when ordering the results.
     * @param page A page number within the paginated result set.
     * @returns PaginatedReportScheduleList
     * @throws ApiError
     */
    public static reportsSchedulesList(
        frequency?: 'daily' | 'monthly' | 'quarterly' | 'weekly',
        isActive?: boolean,
        ordering?: string,
        page?: number,
    ): CancelablePromise<PaginatedReportScheduleList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/reports/schedules/',
            query: {
                'frequency': frequency,
                'is_active': isActive,
                'ordering': ordering,
                'page': page,
            },
        });
    }
    /**
     * ViewSet for managing report schedules.
     * @param requestBody
     * @returns ReportSchedule
     * @throws ApiError
     */
    public static reportsSchedulesCreate(
        requestBody: ReportSchedule,
    ): CancelablePromise<ReportSchedule> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/reports/schedules/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing report schedules.
     * @param id A unique integer value identifying this Report Schedule.
     * @returns ReportSchedule
     * @throws ApiError
     */
    public static reportsSchedulesRetrieve(
        id: number,
    ): CancelablePromise<ReportSchedule> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/reports/schedules/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * ViewSet for managing report schedules.
     * @param id A unique integer value identifying this Report Schedule.
     * @param requestBody
     * @returns ReportSchedule
     * @throws ApiError
     */
    public static reportsSchedulesUpdate(
        id: number,
        requestBody: ReportSchedule,
    ): CancelablePromise<ReportSchedule> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/reports/schedules/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing report schedules.
     * @param id A unique integer value identifying this Report Schedule.
     * @param requestBody
     * @returns ReportSchedule
     * @throws ApiError
     */
    public static reportsSchedulesPartialUpdate(
        id: number,
        requestBody?: PatchedReportSchedule,
    ): CancelablePromise<ReportSchedule> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/reports/schedules/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Toggle schedule active state.
     * @param id A unique integer value identifying this Report Schedule.
     * @param requestBody
     * @returns ReportSchedule
     * @throws ApiError
     */
    public static reportsSchedulesToggleActiveCreate(
        id: number,
        requestBody: ReportSchedule,
    ): CancelablePromise<ReportSchedule> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/reports/schedules/{id}/toggle-active/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing report templates.
     * @param isActive
     * @param ordering Which field to use when ordering the results.
     * @param page A page number within the paginated result set.
     * @param reportType * `transaction` - Transaction Report
     * * `account` - Account Report
     * * `fraud` - Fraud Report
     * * `compliance` - Compliance Report
     * * `financial` - Financial Report
     * * `audit` - Audit Report
     * * `performance` - Performance Report
     * @returns PaginatedReportTemplateList
     * @throws ApiError
     */
    public static reportsTemplatesList(
        isActive?: boolean,
        ordering?: string,
        page?: number,
        reportType?: 'account' | 'audit' | 'compliance' | 'financial' | 'fraud' | 'performance' | 'transaction',
    ): CancelablePromise<PaginatedReportTemplateList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/reports/templates/',
            query: {
                'is_active': isActive,
                'ordering': ordering,
                'page': page,
                'report_type': reportType,
            },
        });
    }
    /**
     * ViewSet for managing report templates.
     * @param requestBody
     * @returns ReportTemplate
     * @throws ApiError
     */
    public static reportsTemplatesCreate(
        requestBody: ReportTemplate,
    ): CancelablePromise<ReportTemplate> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/reports/templates/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing report templates.
     * @param id A unique integer value identifying this Report Template.
     * @returns ReportTemplate
     * @throws ApiError
     */
    public static reportsTemplatesRetrieve(
        id: number,
    ): CancelablePromise<ReportTemplate> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/reports/templates/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
