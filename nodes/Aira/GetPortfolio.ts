import type {
	IExecutePaginationFunctions,
	INodeExecutionData,
	INodePropertyOptions,
} from 'n8n-workflow';

import { paginateCompanyRows, type PageRequest } from './pagination';

/**
 * Get Portfolio Companies (PIN-6283): `GET /v1/companies`, full `PortfolioCompany`
 * records, no filters.
 *
 * A row with a null company id (email-sync/CRM-import companies with no CDH match) passes
 * through as-is — it simply cannot be chained into `Get Company`, unlike search and
 * saved-view rows, which always carry a `cmp_` id.
 */

export async function paginateGetPortfolio(
	this: IExecutePaginationFunctions
): Promise<INodeExecutionData[]> {
	const returnAll = this.getNodeParameter('returnAll', false) as boolean;
	const limit = returnAll ? Number.POSITIVE_INFINITY : (this.getNodeParameter('limit') as number);

	return paginateCompanyRows.call(this, {
		totalLimit: limit,
		buildRequest: (pageLimit, pageCursor): PageRequest => ({
			method: 'GET',
			url: '/companies',
			qs: {
				limit: pageLimit,
				...(pageCursor ? { cursor: pageCursor } : {}),
			},
		}),
	});
}

export const getPortfolioOperation: INodePropertyOptions = {
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
