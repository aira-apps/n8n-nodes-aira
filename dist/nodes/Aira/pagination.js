"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PAGE_REQUEST_INTERVAL_MS = exports.MAX_LIST_LIMIT = exports.DEFAULT_LIST_LIMIT = exports.PAGE_SIZE_CEILING = void 0;
exports.clampPageSize = clampPageSize;
exports.__resetThrottleForTests = __resetThrottleForTests;
exports.paginateCompanyRows = paginateCompanyRows;
const n8n_workflow_1 = require("n8n-workflow");
const constants_1 = require("./constants");
const errors_1 = require("./errors");
exports.PAGE_SIZE_CEILING = 99;
exports.DEFAULT_LIST_LIMIT = 50;
exports.MAX_LIST_LIMIT = 1000;
exports.PAGE_REQUEST_INTERVAL_MS = 600;
function clampPageSize(remaining) {
    return Math.min(exports.PAGE_SIZE_CEILING, remaining);
}
let lastRequestStartedAt = null;
async function throttleRequest() {
    if (lastRequestStartedAt !== null) {
        const remaining = exports.PAGE_REQUEST_INTERVAL_MS - (Date.now() - lastRequestStartedAt);
        if (remaining > 0) {
            await (0, n8n_workflow_1.sleep)(remaining);
        }
    }
    lastRequestStartedAt = Date.now();
}
function __resetThrottleForTests() {
    lastRequestStartedAt = null;
}
async function paginateCompanyRows(options) {
    var _a;
    var _b;
    const items = [];
    let remaining = options.totalLimit;
    let cursor = options.initialCursor;
    while (remaining > 0) {
        const pageLimit = clampPageSize(remaining);
        const request = options.buildRequest(pageLimit, cursor);
        await throttleRequest();
        const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'airaApi', {
            method: request.method,
            baseURL: constants_1.AIRA_CONNECT_BASE_URL,
            url: request.url,
            qs: request.qs,
            body: request.body,
            json: true,
            returnFullResponse: true,
            ignoreHttpStatusErrors: true,
        }));
        (0, errors_1.throwOnErrorResponse)(this.getNode(), response.statusCode, response.body);
        const page = response.body;
        for (const row of page.data) {
            items.push({ json: row });
        }
        remaining -= pageLimit;
        cursor = (_b = (_a = page.meta) === null || _a === void 0 ? void 0 : _a.next_cursor) !== null && _b !== void 0 ? _b : null;
        if (!cursor)
            break;
    }
    if (options.emitCursor && cursor) {
        items.push({ json: { next_cursor: cursor } });
    }
    return items;
}
//# sourceMappingURL=pagination.js.map