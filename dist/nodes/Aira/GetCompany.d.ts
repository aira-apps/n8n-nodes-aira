import type { IExecuteSingleFunctions, IHttpRequestOptions, IN8nHttpFullResponse, INodeExecutionData, INodePropertyOptions } from 'n8n-workflow';
export declare const COMPANY_LOCATOR_MODES: {
    readonly id: 'id';
    readonly url: 'url';
    readonly orgNumber: 'orgNumber';
};
export type CompanyLocatorMode = (typeof COMPANY_LOCATOR_MODES)[keyof typeof COMPANY_LOCATOR_MODES];
export declare const WEBSITE_URL_EXTRACT_REGEX: RegExp;
export declare const NO_MATCH_SENTINEL_ID = "cmp_n8n-node-no-match-000000000000";
export declare function resolveCompanyRequest(this: IExecuteSingleFunctions, requestOptions: IHttpRequestOptions): Promise<IHttpRequestOptions>;
export declare function suppressNotFound(this: IExecuteSingleFunctions, items: INodeExecutionData[], response: IN8nHttpFullResponse): Promise<INodeExecutionData[]>;
export declare const unwrapDataEnvelope: {
    type: 'rootProperty';
    properties: {
        property: string;
    };
};
export declare const getCompanyOperation: INodePropertyOptions;
