import type {
	IExecutePaginationFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodeListSearchResult,
	INodePropertyOptions,
} from 'n8n-workflow';

import { AIRA_CONNECT_BASE_URL } from './constants';
import { throwOnErrorResponse } from './errors';
import { paginateCompanyRows, type PageRequest } from './pagination';

/**
 * Get Saved View Companies (PIN-6283): `GET /v1/saved-views/{id}/companies`. Rows are
 * `CompanySummary`, exactly as Search Companies returns — a saved view is a stored query,
 * resolved live on every call.
 */

type SavedViewLocator = { mode: 'list' | 'id'; value: string };
type SavedViewOptions = { outputCursor?: boolean };

export async function paginateGetSavedView(
	this: IExecutePaginationFunctions
): Promise<INodeExecutionData[]> {
	const savedView = this.getNodeParameter('savedView') as SavedViewLocator;
	const limit = this.getNodeParameter('limit') as number;
	const cursor = (this.getNodeParameter('cursor') as string) || null;
	const options = this.getNodeParameter('options', {}) as SavedViewOptions;

	return paginateCompanyRows.call(this, {
		totalLimit: limit,
		initialCursor: cursor,
		emitCursor: options.outputCursor === true,
		buildRequest: (pageLimit, pageCursor): PageRequest => ({
			method: 'GET',
			url: `/saved-views/${encodeURIComponent(savedView.value)}/companies`,
			qs: {
				limit: pageLimit,
				...(pageCursor ? { cursor: pageCursor } : {}),
			},
		}),
	});
}

type SavedViewListRow = { id: string; name: string };
type SavedViewListResponse = { data: SavedViewListRow[]; meta?: { next_cursor?: string | null } };

/**
 * The most saved views this walks before giving up — an organization's saved views are a
 * handful, hand-curated, so this is far above any real count. It exists only so a
 * pathological org can't turn a dropdown open into an unbounded loop; reading a saved view
 * is free (no `companyRows` metering — see the file header), so walking this far costs
 * nothing but the requests themselves.
 */
const MAX_SAVED_VIEWS_WALKED = 2000;
const SAVED_VIEWS_PAGE_SIZE = 200;

/**
 * `searchListMethod` behind the "From List" resourceLocator mode. Metered as
 * `saved_views`, not company rows. The name filter is applied client-side — the endpoint
 * takes no `q`/name parameter — so this walks every page rather than stopping at one, or a
 * view past the first page would be invisible to a typed search with no signal why.
 */
export async function searchSavedViews(
	this: ILoadOptionsFunctions,
	filter?: string
): Promise<INodeListSearchResult> {
	const needle = filter?.toLowerCase();
	const results: { name: string; value: string }[] = [];
	let cursor: string | null = null;
	// Distinct from `results.length`: a filter that matches few or no views must not defeat
	// the walk cap — bounded on views EXAMINED, not views MATCHED, or a narrow filter over a
	// large collection would keep paging past MAX_SAVED_VIEWS_WALKED indefinitely.
	let examined = 0;

	do {
		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'airaApi', {
			method: 'GET',
			baseURL: AIRA_CONNECT_BASE_URL,
			url: '/saved-views',
			qs: { limit: SAVED_VIEWS_PAGE_SIZE, ...(cursor ? { cursor } : {}) },
			json: true,
			returnFullResponse: true,
			ignoreHttpStatusErrors: true,
		})) as { statusCode: number; body: unknown };

		throwOnErrorResponse(this.getNode(), response.statusCode, response.body);

		const body = response.body as SavedViewListResponse;
		for (const view of body.data) {
			if (!needle || view.name.toLowerCase().includes(needle)) {
				results.push({ name: view.name, value: view.id });
			}
		}
		examined += body.data.length;

		cursor = body.meta?.next_cursor ?? null;
	} while (cursor && examined < MAX_SAVED_VIEWS_WALKED);

	return { results };
}

/** `sav_` ids only — mistyped, and the panel rejects it before the workflow runs. */
export const SAVED_VIEW_ID_REGEX = /^sav_.+$/;

export const getSavedViewOperation: INodePropertyOptions = {
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
