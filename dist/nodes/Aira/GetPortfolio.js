"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPortfolioOperation = void 0;
exports.paginateGetPortfolio = paginateGetPortfolio;
const pagination_1 = require("./pagination");
async function paginateGetPortfolio() {
    const returnAll = this.getNodeParameter('returnAll', false);
    const limit = returnAll ? Number.POSITIVE_INFINITY : this.getNodeParameter('limit');
    return pagination_1.paginateCompanyRows.call(this, {
        totalLimit: limit,
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