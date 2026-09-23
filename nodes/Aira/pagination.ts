import type { IDataObject, IExecutePaginationFunctions, INodeExecutionData } from 'n8n-workflow';
import { sleep } from 'n8n-workflow';

import { AIRA_CONNECT_BASE_URL } from './constants';
import { throwOnErrorResponse } from './errors';

/**
 * The shared paginator for the three list operations (PIN-6283).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Why this bypasses declarative `routing.request`/`postReceive` entirely
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * n8n has no built-in pagination type that puts a cursor in a POST body (its `'offset'`
 * type is offset-based, and its `'generic'` type has no way to clamp a page size against
 * remaining budget or emit a trailing cursor item). The function form of
 * `routing.operations.pagination` is n8n's own documented escape hatch for exactly this —
 * see `IN8nRequestOperations.pagination`'s function-typed member in `n8n-workflow`.
 *
 * Calling `this.helpers.httpRequestWithAuthentication` directly, rather than
 * `this.makeRoutingRequest`, is the same choice `GetCompany.ts`'s `resolveCompanyRequest`
 * already made for its search sub-request: `makeRoutingRequest` re-runs this operation's
 * own `preSend`/`postReceive` per call, which would re-enter this very function. A direct
 * call keeps the loop, the error mapping and the envelope-unwrapping in one place.
 */

/** CDH pages at 99 internally; a request for more is chunked, never sent as one call. */
export const PAGE_SIZE_CEILING = 99;

/** The node's published `Limit` bounds — shared by all three list operations. */
export const DEFAULT_LIST_LIMIT = 50;
export const MAX_LIST_LIMIT = 1000;

/**
 * Milliseconds between chunked requests, holding a sustained multi-item run under the
 * 120-requests/60s read budget. A single 1,000-row run (11 requests at the 99 ceiling)
 * cannot breach the budget at any speed, so this only matters when many workflow items
 * each drive their own multi-page walk back to back.
 */
export const PAGE_REQUEST_INTERVAL_MS = 600;

/**
 * `min(99, remaining)` — load-bearing on the FINAL request of a walk, because search and
 * saved-view charge the *requested* page size before the handler runs: asking for 99 when
 * only 7 remain would over-charge the caller by 92 rows for nothing.
 */
export function clampPageSize(remaining: number): number {
	return Math.min(PAGE_SIZE_CEILING, remaining);
}

/**
 * When the last chunked request STARTED, across every `paginateCompanyRows` call in this
 * process — module state, not a per-call local.
 *
 * ⚠️ MODULE-LEVEL ON PURPOSE. n8n runs this operation's pagination function once per input
 * item; a local "is this the first request" flag (the previous shape) resets on every
 * invocation, so N items each pay the interval only WITHIN their own walk — nothing
 * separates item 1's last request from item 2's first. The 120-requests/60s budget is
 * shared by the whole organization regardless of which item or workflow spent it, so the
 * throttle has to be shared the same way. Module state is a fine proxy for that within one
 * n8n process; it does not coordinate across multiple worker processes.
 */
let lastRequestStartedAt: number | null = null;

/** Wait out whatever's left of `PAGE_REQUEST_INTERVAL_MS` since the last request STARTED. */
async function throttleRequest(): Promise<void> {
	if (lastRequestStartedAt !== null) {
		const remaining = PAGE_REQUEST_INTERVAL_MS - (Date.now() - lastRequestStartedAt);
		if (remaining > 0) {
			await sleep(remaining);
		}
	}
	lastRequestStartedAt = Date.now();
}

/**
 * Test-only. The throttle is module state so it can protect a real n8n process across
 * items and invocations (see `lastRequestStartedAt`) — which means a test suite must reset
 * it between cases itself, the same way it would reset a mocked module. Not for
 * production code.
 */
export function __resetThrottleForTests(): void {
	lastRequestStartedAt = null;
}

export type CompanyRowsPage = {
	data: unknown[];
	meta?: { next_cursor?: string | null };
};

export type PageRequest = {
	method: 'GET' | 'POST';
	/** Relative to `AIRA_CONNECT_BASE_URL`. */
	url: string;
	qs?: IDataObject;
	body?: IDataObject;
};

export type PaginateCompanyRowsOptions = {
	/** The node's `Limit` parameter — never exceeded, however many pages that takes. */
	totalLimit: number;
	/** The node's `Cursor` parameter, or null to start a fresh walk. */
	initialCursor: string | null;
	/** `Options.outputCursor` — emit one trailing `{ next_cursor }` item when set. */
	emitCursor: boolean;
	/** Builds one page's request. Called again for every chunk, with the running cursor. */
	buildRequest: (pageLimit: number, cursor: string | null) => PageRequest;
};

/**
 * Fetch up to `totalLimit` company rows, chunked at `PAGE_SIZE_CEILING`, honouring
 * `PAGE_REQUEST_INTERVAL_MS` between chunks and discarding whatever was fetched so far
 * the moment the API throws (`throwOnErrorResponse` — never a partial success).
 */
export async function paginateCompanyRows(
	this: IExecutePaginationFunctions,
	options: PaginateCompanyRowsOptions
): Promise<INodeExecutionData[]> {
	const items: INodeExecutionData[] = [];
	let remaining = options.totalLimit;
	let cursor = options.initialCursor;

	while (remaining > 0) {
		const pageLimit = clampPageSize(remaining);
		const request = options.buildRequest(pageLimit, cursor);

		await throttleRequest();

		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'airaApi', {
			method: request.method,
			baseURL: AIRA_CONNECT_BASE_URL,
			url: request.url,
			qs: request.qs,
			body: request.body,
			json: true,
			returnFullResponse: true,
			ignoreHttpStatusErrors: true,
		})) as { statusCode: number; body: unknown };

		// Throws and discards `items` (nothing is returned) rather than returning a
		// partial page — `daily_row_limit_exceeded` and `rate_limit_exceeded` both fail
		// the whole walk, per the ticket's "discards the partial page".
		throwOnErrorResponse(this.getNode(), response.statusCode, response.body);

		const page = response.body as CompanyRowsPage;
		for (const row of page.data) {
			items.push({ json: row as IDataObject });
		}

		remaining -= pageLimit;
		cursor = page.meta?.next_cursor ?? null;
		if (!cursor) break;
	}

	if (options.emitCursor && cursor) {
		items.push({ json: { next_cursor: cursor } });
	}

	return items;
}
