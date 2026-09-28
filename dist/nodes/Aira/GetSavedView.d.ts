import type { IExecutePaginationFunctions, ILoadOptionsFunctions, INodeExecutionData, INodeListSearchResult, INodePropertyOptions } from 'n8n-workflow';
export declare function paginateGetSavedView(this: IExecutePaginationFunctions): Promise<INodeExecutionData[]>;
export declare function searchSavedViews(this: ILoadOptionsFunctions, filter?: string): Promise<INodeListSearchResult>;
export declare const SAVED_VIEW_ID_REGEX: RegExp;
export declare const getSavedViewOperation: INodePropertyOptions;
