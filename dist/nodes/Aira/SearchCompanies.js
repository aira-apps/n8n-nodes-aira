"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchCompaniesOperation = exports.FIELD_OPTIONS = void 0;
exports.paginateSearchCompanies = paginateSearchCompanies;
exports.getOperatorsForField = getOperatorsForField;
const n8n_workflow_1 = require("n8n-workflow");
const vocabulary_1 = require("../../generated/vocabulary");
const pagination_1 = require("./pagination");
const queryFold_1 = require("./queryFold");
async function paginateSearchCompanies() {
    var _a;
    var _b;
    const predicates = this.getNodeParameter('predicates', {});
    const rows = (_b = predicates.row) !== null && _b !== void 0 ? _b : [];
    const limit = this.getNodeParameter('limit');
    const cursor = this.getNodeParameter('cursor') || null;
    const options = this.getNodeParameter('options', {});
    const aql = (_a = options.aql) === null || _a === void 0 ? void 0 : _a.trim();
    let body;
    try {
        body = aql ? { query_string: aql } : { query: (0, queryFold_1.foldPredicateRows)(rows) };
    }
    catch (error) {
        throw new n8n_workflow_1.NodeOperationError(this.getNode(), error);
    }
    return pagination_1.paginateCompanyRows.call(this, {
        totalLimit: limit,
        initialCursor: cursor,
        emitCursor: options.outputCursor === true,
        buildRequest: (pageLimit, pageCursor) => ({
            method: 'POST',
            url: '/companies/search',
            body: {
                ...body,
                limit: pageLimit,
                ...(pageCursor ? { cursor: pageCursor } : {}),
            },
        }),
    });
}
async function getOperatorsForField() {
    const fieldName = this.getCurrentNodeParameter('&field');
    const field = vocabulary_1.QUERY_FIELDS.find(candidate => candidate.name === fieldName);
    if (!field)
        return [];
    return field.operators.map(operator => ({
        name: vocabulary_1.OPERATOR_LABELS[operator],
        value: operator,
    }));
}
exports.FIELD_OPTIONS = vocabulary_1.QUERY_FIELDS.map(field => ({
    name: field.label,
    value: field.name,
    description: field.description,
}));
exports.searchCompaniesOperation = {
    name: 'Search Companies',
    value: 'search',
    action: 'Search companies',
    description: 'Search the company universe with a boolean filter',
    routing: {
        request: { method: 'POST', url: '/companies/search' },
        send: { paginate: true },
        operations: { pagination: paginateSearchCompanies },
    },
};
//# sourceMappingURL=SearchCompanies.js.map