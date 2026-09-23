"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.throwOnErrorResponse = throwOnErrorResponse;
const n8n_workflow_1 = require("n8n-workflow");
const DAILY_ROW_LIMIT_MESSAGE = 'Your organization reached its daily limit for company records. The limit is counted across every endpoint that returns companies and resets at midnight UTC. This page was discarded rather than partially delivered — resume the workflow after the reset, or talk to your account manager about a bigger daily allowance for a scheduled import.';
const RATE_LIMIT_MESSAGE = 'Your organization is sending requests to the Aira Connect API faster than it allows right now. Wait a moment, then run this workflow again.';
function throwOnErrorResponse(node, statusCode, body) {
    var _a, _b;
    var _c;
    if (statusCode < 400)
        return;
    const errorBody = body;
    const code = (_a = errorBody === null || errorBody === void 0 ? void 0 : errorBody.error) === null || _a === void 0 ? void 0 : _a.code;
    if (code === 'daily_row_limit_exceeded') {
        throw new n8n_workflow_1.NodeApiError(node, (body !== null && body !== void 0 ? body : {}), {
            message: DAILY_ROW_LIMIT_MESSAGE,
            httpCode: String(statusCode),
        });
    }
    if (code === 'rate_limit_exceeded') {
        throw new n8n_workflow_1.NodeApiError(node, (body !== null && body !== void 0 ? body : {}), {
            message: RATE_LIMIT_MESSAGE,
            httpCode: String(statusCode),
        });
    }
    throw new n8n_workflow_1.NodeApiError(node, (body !== null && body !== void 0 ? body : {}), {
        message: (_c = (_b = errorBody === null || errorBody === void 0 ? void 0 : errorBody.error) === null || _b === void 0 ? void 0 : _b.message) !== null && _c !== void 0 ? _c : `Aira API request failed with status ${statusCode}`,
        httpCode: String(statusCode),
    });
}
//# sourceMappingURL=errors.js.map