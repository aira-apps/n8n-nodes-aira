import type { IExecutePaginationFunctions, ILoadOptionsFunctions, INodeExecutionData, INodePropertyOptions } from 'n8n-workflow';
export declare function paginateSearchCompanies(this: IExecutePaginationFunctions): Promise<INodeExecutionData[]>;
export declare function getOperatorsForField(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
export declare const FIELD_OPTIONS: INodePropertyOptions[];
export declare const searchCompaniesOperation: INodePropertyOptions;
