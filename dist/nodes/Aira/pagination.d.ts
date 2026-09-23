import type { IDataObject, IExecutePaginationFunctions, INodeExecutionData } from 'n8n-workflow';
export declare const PAGE_SIZE_CEILING = 99;
export declare const DEFAULT_LIST_LIMIT = 50;
export declare const MAX_LIST_LIMIT = 1000;
export declare const PAGE_REQUEST_INTERVAL_MS = 600;
export declare function clampPageSize(remaining: number): number;
export declare function __resetThrottleForTests(): void;
export type CompanyRowsPage = {
    data: unknown[];
    meta?: {
        next_cursor?: string | null;
    };
};
export type PageRequest = {
    method: 'GET' | 'POST';
    url: string;
    qs?: IDataObject;
    body?: IDataObject;
};
export type PaginateCompanyRowsOptions = {
    totalLimit: number;
    initialCursor: string | null;
    emitCursor: boolean;
    buildRequest: (pageLimit: number, cursor: string | null) => PageRequest;
};
export declare function paginateCompanyRows(this: IExecutePaginationFunctions, options: PaginateCompanyRowsOptions): Promise<INodeExecutionData[]>;
