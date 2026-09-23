"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Aira = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const constants_1 = require("./constants");
const GetCompany_1 = require("./GetCompany");
const GetPortfolio_1 = require("./GetPortfolio");
const GetSavedView_1 = require("./GetSavedView");
const pagination_1 = require("./pagination");
const SearchCompanies_1 = require("./SearchCompanies");
const vocabulary_1 = require("../../generated/vocabulary");
const STRING_VALUE_FIELDS = vocabulary_1.QUERY_FIELDS.filter(field => field.valueType.kind === 'string').map(field => field.name);
const NUMBER_VALUE_FIELDS = vocabulary_1.QUERY_FIELDS.filter(field => field.valueType.kind === 'number').map(field => field.name);
const ENUM_VALUE_PROPERTIES = vocabulary_1.QUERY_FIELDS.filter((field) => field.valueType.kind === 'enum').map(field => ({
    displayName: 'Value',
    name: 'value',
    type: 'options',
    options: field.valueType.values.map(value => ({ name: value, value })),
    default: '',
    displayOptions: { show: { field: [field.name] } },
}));
class Aira {
    constructor() {
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {
                displayName: 'Aira',
                name: 'aira',
                icon: { light: 'file:aira.svg', dark: 'file:aira.dark.svg' },
                group: ['transform'],
                version: 1,
                subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
                description: 'Read the companies your organisation tracks in Aira Connect',
                defaults: { name: 'Aira' },
                usableAsTool: true,
                inputs: [n8n_workflow_1.NodeConnectionTypes.Main],
                outputs: [n8n_workflow_1.NodeConnectionTypes.Main],
                credentials: [{ name: 'airaApi', required: true }],
                requestDefaults: {
                    baseURL: constants_1.AIRA_CONNECT_BASE_URL,
                    headers: { Accept: 'application/json' },
                    json: true,
                },
                properties: [
                    {
                        displayName: 'Resource',
                        name: 'resource',
                        type: 'options',
                        noDataExpression: true,
                        options: [{ name: 'Company', value: 'company' }],
                        default: 'company',
                    },
                    {
                        displayName: 'Operation',
                        name: 'operation',
                        type: 'options',
                        noDataExpression: true,
                        displayOptions: { show: { resource: ['company'] } },
                        options: [
                            GetCompany_1.getCompanyOperation,
                            GetPortfolio_1.getPortfolioOperation,
                            GetSavedView_1.getSavedViewOperation,
                            SearchCompanies_1.searchCompaniesOperation,
                        ],
                        default: 'get',
                    },
                    {
                        displayName: 'Company',
                        name: 'company',
                        type: 'resourceLocator',
                        default: { mode: 'id', value: '' },
                        required: true,
                        displayOptions: { show: { resource: ['company'], operation: ['get'] } },
                        description: 'The company to retrieve',
                        modes: [
                            {
                                displayName: 'By ID',
                                name: 'id',
                                type: 'string',
                                placeholder: 'cmp_US.1.87187890',
                                hint: 'The Aira company id, as returned by another Aira operation',
                            },
                            {
                                displayName: 'By URL',
                                name: 'url',
                                type: 'string',
                                placeholder: 'https://www.volvo.com',
                                hint: 'The company’s website — a full URL or a bare domain',
                                extractValue: { type: 'regex', regex: GetCompany_1.WEBSITE_URL_EXTRACT_REGEX },
                            },
                            {
                                displayName: 'By Organization Number',
                                name: 'orgNumber',
                                type: 'string',
                                placeholder: '556036-0793',
                                hint: 'The national company registration number',
                            },
                        ],
                    },
                    {
                        displayName: 'This operation has no filters. Chain a downstream Filter node if you need to narrow the results.',
                        name: 'portfolioNoFiltersNotice',
                        type: 'notice',
                        default: '',
                        displayOptions: { show: { resource: ['company'], operation: ['getPortfolio'] } },
                    },
                    {
                        displayName: 'Saved View',
                        name: 'savedView',
                        type: 'resourceLocator',
                        default: { mode: 'list', value: '' },
                        required: true,
                        displayOptions: { show: { resource: ['company'], operation: ['getSavedView'] } },
                        description: 'The saved view to read companies from',
                        modes: [
                            {
                                displayName: 'From List',
                                name: 'list',
                                type: 'list',
                                typeOptions: { searchListMethod: 'searchSavedViews', searchable: false },
                            },
                            {
                                displayName: 'By ID',
                                name: 'id',
                                type: 'string',
                                placeholder: 'sav_...',
                                validation: [
                                    {
                                        type: 'regex',
                                        properties: {
                                            regex: GetSavedView_1.SAVED_VIEW_ID_REGEX.source,
                                            errorMessage: 'Not a valid saved view id — expected one starting with "sav_".',
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        displayName: 'Filters',
                        name: 'predicates',
                        type: 'fixedCollection',
                        typeOptions: { multipleValues: true },
                        placeholder: 'Add Filter',
                        default: {},
                        displayOptions: { show: { resource: ['company'], operation: ['search'] } },
                        options: [
                            {
                                name: 'row',
                                displayName: 'Filter',
                                values: [
                                    {
                                        displayName: 'Field',
                                        name: 'field',
                                        type: 'options',
                                        options: SearchCompanies_1.FIELD_OPTIONS,
                                        default: 'id',
                                    },
                                    {
                                        displayName: 'Operator Name or ID',
                                        name: 'operator',
                                        type: 'options',
                                        description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
                                        typeOptions: {
                                            loadOptionsMethod: 'getOperatorsForField',
                                            loadOptionsDependsOn: ['&field'],
                                        },
                                        default: '',
                                    },
                                    {
                                        displayName: 'Value',
                                        name: 'value',
                                        type: 'string',
                                        default: '',
                                        displayOptions: {
                                            show: { field: STRING_VALUE_FIELDS },
                                        },
                                        hint: 'For a field that accepts a list, or the "Is One Of" operator, separate values with a comma',
                                    },
                                    {
                                        displayName: 'Value',
                                        name: 'value',
                                        type: 'number',
                                        default: 0,
                                        displayOptions: {
                                            show: { field: NUMBER_VALUE_FIELDS },
                                        },
                                    },
                                    ...ENUM_VALUE_PROPERTIES,
                                ],
                            },
                        ],
                    },
                    {
                        displayName: 'A search may contain at most 32 predicates across at most 8 branches of an OR, one country per search, and Starts With / Contains on Name needs at least 3 characters. A breach is rejected by the API, not by this panel.',
                        name: 'searchLimitsNotice',
                        type: 'notice',
                        default: '',
                        displayOptions: { show: { resource: ['company'], operation: ['search'] } },
                    },
                    {
                        displayName: 'Limit',
                        name: 'limit',
                        type: 'number',
                        default: 50,
                        typeOptions: { minValue: 1, maxValue: pagination_1.MAX_LIST_LIMIT },
                        description: 'Max number of results to return',
                        displayOptions: {
                            show: {
                                resource: ['company'],
                                operation: ['getPortfolio', 'getSavedView', 'search'],
                            },
                        },
                    },
                    {
                        displayName: 'Cursor',
                        name: 'cursor',
                        type: 'string',
                        default: '',
                        description: 'Continue a previous page walk — paste in the cursor it emitted (see Options → Output Pagination Cursor)',
                        displayOptions: {
                            show: {
                                resource: ['company'],
                                operation: ['getPortfolio', 'getSavedView', 'search'],
                            },
                        },
                    },
                    {
                        displayName: 'Options',
                        name: 'options',
                        type: 'collection',
                        placeholder: 'Add Option',
                        default: {},
                        displayOptions: {
                            show: { resource: ['company'], operation: ['getPortfolio', 'getSavedView'] },
                        },
                        options: [
                            {
                                displayName: 'Output Pagination Cursor',
                                name: 'outputCursor',
                                type: 'boolean',
                                default: false,
                                description: 'Whether to emit one trailing item carrying `next_cursor`, only when more rows remain past what Limit fetched',
                            },
                        ],
                    },
                    {
                        displayName: 'Options',
                        name: 'options',
                        type: 'collection',
                        placeholder: 'Add Option',
                        default: {},
                        displayOptions: { show: { resource: ['company'], operation: ['search'] } },
                        options: [
                            {
                                displayName: 'AQL Query',
                                name: 'aql',
                                type: 'string',
                                typeOptions: { rows: 3 },
                                default: '',
                                description: 'A query written in Aira Query Language instead of the Filters above — the only way to express OR or NOT. Replaces the Filters entirely when set.',
                                placeholder: 'country = "SE" AND (revenue >= 50000000 OR employees >= 250)',
                            },
                            {
                                displayName: 'Output Pagination Cursor',
                                name: 'outputCursor',
                                type: 'boolean',
                                default: false,
                                description: 'Whether to emit one trailing item carrying `next_cursor`, only when more rows remain past what Limit fetched',
                            },
                        ],
                    },
                ],
            }
        });
        Object.defineProperty(this, "methods", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {
                loadOptions: {
                    getOperatorsForField: SearchCompanies_1.getOperatorsForField,
                },
                listSearch: {
                    searchSavedViews: GetSavedView_1.searchSavedViews,
                },
            }
        });
    }
}
exports.Aira = Aira;
//# sourceMappingURL=Aira.node.js.map