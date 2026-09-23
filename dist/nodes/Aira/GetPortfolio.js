"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPortfolioOperation = void 0;
exports.paginateGetPortfolio = paginateGetPortfolio;
const pagination_1 = require("./pagination");
async function paginateGetPortfolio() {
    const limit = this.getNodeParameter('limit');
    const cursor = this.getNodeParameter('cursor') || null;
    const options = this.getNodeParameter('options', {});
    return pagination_1.paginateCompanyRows.call(this, {
        totalLimit: limit,
        initialCursor: cursor,
        emitCursor: options.outputCursor === true,
        buildRequest: (pageLimit, pageCursor) => ({
            method: 'GET',
            url: '/companies',
            qs: {
                limit: pageLimit,
                ...(pageCursor ? { cursor: pageCursor } : {}),
            },
        }),
    });
}
exports.getPortfolioOperation = {
    name: 'Get Portfolio Companies',
    value: 'getPortfolio',
    action: 'Get many portfolio companies',
    description: 'Retrieve the companies your organization holds, newest entry first',
    routing: {
        request: { method: 'GET', url: '/companies' },
        send: { paginate: true },
        operations: { pagination: paginateGetPortfolio },
    },
};
//# sourceMappingURL=GetPortfolio.js.map