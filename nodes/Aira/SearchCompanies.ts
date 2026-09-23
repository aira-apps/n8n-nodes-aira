import type {
	IExecutePaginationFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { OPERATOR_LABELS, QUERY_FIELDS } from '../../generated/vocabulary';
import { paginateCompanyRows, type PageRequest } from './pagination';
import { foldPredicateRows, type PredicateRow } from './queryFold';

/**
 * Search Companies (PIN-6283): `POST /v1/companies/search`.
 *
 * Flat predicate rows are the whole panel. `AQL Query` under Options REPLACES the rows
 * entirely when set — it is the only way to reach `or`/`not`, since nested groups were
 * rejected on rendering (two groups render as identical, unlabelled ~12px-indent blocks
 * with no way to see what is ORed). See `Aira.node.ts` for the property tree.
 */

type SearchOptions = { outputCursor?: boolean; aql?: string };

export async function paginateSearchCompanies(
	this: IExecutePaginationFunctions
): Promise<INodeExecutionData[]> {
	const predicates = this.getNodeParameter('predicates', {}) as { row?: PredicateRow[] };
	const rows = predicates.row ?? [];
	const limit = this.getNodeParameter('limit') as number;
	const cursor = (this.getNodeParameter('cursor') as string) || null;
	const options = this.getNodeParameter('options', {}) as SearchOptions;

	const aql = options.aql?.trim();
	let body: { query_string: string } | { query: ReturnType<typeof foldPredicateRows> };
	try {
		body = aql ? { query_string: aql } : { query: foldPredicateRows(rows) };
	} catch (error) {
		// `foldPredicateRows`/`parsePredicateValue` are plain, node-context-free functions
		// (see `queryFold.ts` — kept that way so Seam 2's goldens test them directly), so
		// their panel-facing errors are wrapped here, at the one call site that has a node
		// to attach them to.
		throw new NodeOperationError(this.getNode(), error as Error);
	}

	return paginateCompanyRows.call(this, {
		totalLimit: limit,
		initialCursor: cursor,
		emitCursor: options.outputCursor === true,
		buildRequest: (pageLimit, pageCursor): PageRequest => ({
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

/**
 * `loadOptions` behind the operator dropdown, narrowed to the row's own `field` via
 * `loadOptionsDependsOn: ['&field']`. Compile-time vocabulary, so this needs no
 * credential and makes no network call.
 */
export async function getOperatorsForField(
	this: ILoadOptionsFunctions
): Promise<INodePropertyOptions[]> {
	const fieldName = this.getCurrentNodeParameter('&field') as string | undefined;
	const field = QUERY_FIELDS.find(candidate => candidate.name === fieldName);
	if (!field) return [];

	return field.operators.map(operator => ({
		name: OPERATOR_LABELS[operator],
		value: operator,
	}));
}

export const FIELD_OPTIONS: INodePropertyOptions[] = QUERY_FIELDS.map(field => ({
	name: field.label,
	value: field.name,
	description: field.description,
}));

export const searchCompaniesOperation: INodePropertyOptions = {
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
