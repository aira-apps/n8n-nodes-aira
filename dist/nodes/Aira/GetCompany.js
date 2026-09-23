"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCompanyOperation = exports.unwrapDataEnvelope = exports.NO_MATCH_SENTINEL_ID = exports.WEBSITE_URL_EXTRACT_REGEX = exports.COMPANY_LOCATOR_MODES = void 0;
exports.resolveCompanyRequest = resolveCompanyRequest;
exports.suppressNotFound = suppressNotFound;
const errors_1 = require("./errors");
exports.COMPANY_LOCATOR_MODES = {
    id: 'id',
    url: 'url',
    orgNumber: 'orgNumber',
};
exports.WEBSITE_URL_EXTRACT_REGEX = /^(?:https?:\/\/)?(?:www\.)?([^/?#:]+)/;
exports.NO_MATCH_SENTINEL_ID = 'cmp_n8n-node-no-match-000000000000';
async function resolveCompanyRequest(requestOptions) {
    var _a, _b;
    const company = this.getNodeParameter('company');
    const value = this.getNodeParameter('company', undefined, {
        extractValue: true,
    });
    if (company.mode === exports.COMPANY_LOCATOR_MODES.id) {
        requestOptions.url = `/companies/${encodeURIComponent(value)}`;
        return requestOptions;
    }
    const field = company.mode === exports.COMPANY_LOCATOR_MODES.url ? 'website' : 'org_number';
    const searchResponse = (await this.helpers.httpRequestWithAuthentication.call(this, 'airaApi', {
        method: 'POST',
        baseURL: requestOptions.baseURL,
        url: '/companies/search',
        body: { query: { field, operator: 'eq', value }, limit: 1 },
        json: true,
    }));
    const matchId = (_b = (_a = searchResponse.data) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.id;
    requestOptions.url = `/companies/${encodeURIComponent(matchId !== null && matchId !== void 0 ? matchId : exports.NO_MATCH_SENTINEL_ID)}`;
    return requestOptions;
}
async function suppressNotFound(items, response) {
    var _a;
    var _b;
    const statusCode = (_b = response.statusCode) !== null && _b !== void 0 ? _b : 200;
    if (statusCode < 400) {
        return items;
    }
    const body = response.body;
    if (((_a = body === null || body === void 0 ? void 0 : body.error) === null || _a === void 0 ? void 0 : _a.code) === 'not_found') {
        return [];
    }
    (0, errors_1.throwOnErrorResponse)(this.getNode(), statusCode, response.body);
    return items;
}
exports.unwrapDataEnvelope = {
    type: 'rootProperty',
    properties: { property: 'data' },
};
exports.getCompanyOperation = {
    name: 'Get Company',
    value: 'get',
    action: 'Get a company',
    description: 'Retrieve one company by website URL, organisation number, or Aira ID',
    routing: {
        request: {
            method: 'GET',
            url: '=/companies/{{ $parameter["company"] }}',
            ignoreHttpStatusErrors: true,
        },
        send: {
            preSend: [resolveCompanyRequest],
        },
        output: {
            postReceive: [suppressNotFound, exports.unwrapDataEnvelope],
        },
    },
};
//# sourceMappingURL=GetCompany.js.map