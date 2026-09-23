"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSavedViewOperation = exports.SAVED_VIEW_ID_REGEX = void 0;
exports.paginateGetSavedView = paginateGetSavedView;
exports.searchSavedViews = searchSavedViews;
const constants_1 = require("./constants");
const errors_1 = require("./errors");
const pagination_1 = require("./pagination");
async function paginateGetSavedView() {
    const savedView = this.getNodeParameter('savedView');
    const limit = this.getNodeParameter('limit');
    const cursor = this.getNodeParameter('cursor') || null;
    const options = this.getNodeParameter('options', {});
    return pagination_1.paginateCompanyRows.call(this, {
        totalLimit: limit,
        initialCursor: cursor,
        emitCursor: options.outputCursor === true,
        buildRequest: (pageLimit, pageCursor) => ({
            method: 'GET',
            url: `/saved-views/${encodeURIComponent(savedView.value)}/companies`,
            qs: {
                limit: pageLimit,
                ...(pageCursor ? { cursor: pageCursor } : {}),
            },
        }),
    });
}
const MAX_SAVED_VIEWS_WALKED = 2000;
const SAVED_VIEWS_PAGE_SIZE = 200;
async function searchSavedViews(filter) {
    var _a;
    var _b;
    const needle = filter === null || filter === void 0 ? void 0 : filter.toLowerCase();
    const results = [];
    let cursor = null;
    let examined = 0;
    do {
        const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'airaApi', {
            method: 'GET',
            baseURL: constants_1.AIRA_CONNECT_BASE_URL,
            url: '/saved-views',
            qs: { limit: SAVED_VIEWS_PAGE_SIZE, ...(cursor ? { cursor } : {}) },
            json: true,
            returnFullResponse: true,
            ignoreHttpStatusErrors: true,
        }));
        (0, errors_1.throwOnErrorResponse)(this.getNode(), response.statusCode, response.body);
        const body = response.body;
        for (const view of body.data) {
            if (!needle || view.name.toLowerCase().includes(needle)) {
                results.push({ name: view.name, value: view.id });
            }
        }
        examined += body.data.length;
        cursor = (_b = (_a = body.meta) === null || _a === void 0 ? void 0 : _a.next_cursor) !== null && _b !== void 0 ? _b : null;
    } while (cursor && examined < MAX_SAVED_VIEWS_WALKED);
    return { results };
}
exports.SAVED_VIEW_ID_REGEX = /^sav_.+$/;
exports.getSavedViewOperation = {
    name: 'Get Saved View Companies',
    value: 'getSavedView',
    action: 'Get many saved view companies',
    description: 'Retrieve the companies matching one of your organization’s saved views',
    routing: {
        request: { method: 'GET', url: '=/saved-views/{{ $parameter["savedView"] }}/companies' },
        send: { paginate: true },
        operations: { pagination: paginateGetSavedView },
    },
};
//# sourceMappingURL=GetSavedView.js.map