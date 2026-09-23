import type {
	IExecuteSingleFunctions,
	IHttpRequestOptions,
	IN8nHttpFullResponse,
	INodeExecutionData,
	INodePropertyOptions,
} from 'n8n-workflow';

import { throwOnErrorResponse } from './errors';

/**
 * Get Company (PIN-6282): one of the three `company` resourceLocator modes.
 *
 * "By ID" needs no search resolution — the RLC auto-unwraps `$parameter["company"]` to
 * the bare id with no `extractValue` in play — but `preSend` still URL-encodes it before
 * building the request path, the same as the id a search resolves for the other two
 * modes; a raw, unencoded id could otherwise carry a `/`, `?` or `#` straight into the
 * request path. "By URL" and "By Organization Number" resolve through
 * `POST /v1/companies/search` first.
 */
export const COMPANY_LOCATOR_MODES = {
	id: 'id',
	url: 'url',
	orgNumber: 'orgNumber',
} as const;

export type CompanyLocatorMode = (typeof COMPANY_LOCATOR_MODES)[keyof typeof COMPANY_LOCATOR_MODES];

interface CompanyLocatorParameter {
	mode: CompanyLocatorMode;
	value: string;
}

/**
 * Reduces a full company URL — scheme, `www.`, path, query string — to its bare domain.
 * Wired as the "By URL" mode's `extractValue`, which requires exactly one capture group.
 *
 * `https://www.volvo.com/en-se/trucks?utm=x` → `volvo.com`. Stops at a `:` too, so an
 * explicit port (`volvo.com:8443`) doesn't ride along into the search value.
 */
export const WEBSITE_URL_EXTRACT_REGEX = /^(?:https?:\/\/)?(?:www\.)?([^/?#:]+)/;

/**
 * A syntactically valid but unassigned `cmp_` id (PIN-6282's `id` prefix, PIN-4574's
 * passthrough encoding — any suffix is a legal `cmp_` id, so this one is simply never
 * going to be a real CDH `prospectingId`).
 *
 * When URL/org-number resolution finds no match, `resolveCompanyRequest` points the
 * primary request at this id rather than short-circuiting locally. That keeps a miss on
 * every mode going through the exact same `GET /v1/companies/{id}` → 404 →
 * `suppressNotFound` path — one not-found implementation (the server's), not two.
 */
export const NO_MATCH_SENTINEL_ID = 'cmp_n8n-node-no-match-000000000000';

interface CompanySearchRow {
	id?: string;
}

interface CompanySearchResponseBody {
	data?: CompanySearchRow[];
}

/**
 * `preSend`. Resolves "By URL" / "By Organization Number" to a company id via search,
 * then re-targets the primary request at `GET /v1/companies/{id}` with that id — the
 * one path that already carries the id straight through with no resolution step.
 */
export async function resolveCompanyRequest(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions
): Promise<IHttpRequestOptions> {
	const company = this.getNodeParameter('company') as CompanyLocatorParameter;

	// The extracted value: for "By URL" this is the domain `extractValue` already
	// reduced the input to, not the raw URL — `getNodeParameter` only applies
	// `extractValue` when asked for explicitly, unlike an `$parameter[...]` expression.
	const value = this.getNodeParameter('company', undefined, {
		extractValue: true,
	}) as string;

	if (company.mode === COMPANY_LOCATOR_MODES.id) {
		requestOptions.url = `/companies/${encodeURIComponent(value)}`;
		return requestOptions;
	}

	const field = company.mode === COMPANY_LOCATOR_MODES.url ? 'website' : 'org_number';

	const searchResponse = (await this.helpers.httpRequestWithAuthentication.call(this, 'airaApi', {
		method: 'POST',
		baseURL: requestOptions.baseURL,
		url: '/companies/search',
		body: { query: { field, operator: 'eq', value }, limit: 1 },
		json: true,
	})) as CompanySearchResponseBody;

	const matchId = searchResponse.data?.[0]?.id;
	requestOptions.url = `/companies/${encodeURIComponent(matchId ?? NO_MATCH_SENTINEL_ID)}`;

	return requestOptions;
}

interface ConnectErrorResponseBody {
	error?: { code?: string; message?: string };
}

/**
 * `postReceive`, step 1 of 2. Runs with `routing.request.ignoreHttpStatusErrors: true`,
 * so nothing has thrown yet — every status, including 401/429/500, reaches here
 * unexamined. `not_found` is the one code this operation turns into empty output rather
 * than a thrown error; everything else throws through `throwOnErrorResponse` (PIN-6283),
 * which is what turns `daily_row_limit_exceeded`/`rate_limit_exceeded` into Aira's own,
 * number-free copy here exactly as it does for the three list operations — this operation
 * counts against the same daily ceiling and rate limit as they do.
 */
export async function suppressNotFound(
	this: IExecuteSingleFunctions,
	items: INodeExecutionData[],
	response: IN8nHttpFullResponse
): Promise<INodeExecutionData[]> {
	const statusCode = response.statusCode ?? 200;
	if (statusCode < 400) {
		return items;
	}

	const body = response.body as ConnectErrorResponseBody | undefined;
	if (body?.error?.code === 'not_found') {
		return [];
	}

	throwOnErrorResponse(this.getNode(), statusCode, response.body);
	return items;
}

/**
 * `postReceive`, step 2 of 2 — declarative, runs only on the items `suppressNotFound`
 * passed through unchanged (a genuine miss is already `[]` by this point, a no-op here).
 * Unwraps the `{ data, meta }` envelope to the bare company record.
 *
 * `meta` is dropped along with the envelope — including `defaults_applied`, which lives
 * inside it. That's not a loss on THIS endpoint: `GET /v1/companies/{id}` always answers
 * `meta: {}` (see `companyDetail.ts`'s route definition — no `meta` schema is declared,
 * and both response examples show `meta: {}`). `defaults_applied` is a `search`-only
 * field; the internal `POST /v1/companies/search` call `resolveCompanyRequest` makes for
 * "By URL"/"By Organization Number" does receive it, but resolving to a single id is the
 * whole job of that call — the defaults it applied while resolving aren't part of what
 * this operation promises to return.
 */
export const unwrapDataEnvelope = {
	type: 'rootProperty' as const,
	properties: { property: 'data' },
};

/** The Get Company operation entry, wired onto the `operation` property's options. */
export const getCompanyOperation: INodePropertyOptions = {
	name: 'Get Company',
	value: 'get',
	action: 'Get a company',
	description: 'Retrieve one company by website URL, organisation number, or Aira ID',
	routing: {
		request: {
			method: 'GET',
			// `resolveCompanyRequest` always overwrites this with the (encoded) resolved
			// id before the request goes out — this is the declarative fallback n8n's
			// tooling sees when it inspects the description without running `preSend`,
			// and it is why the RLC is referenced bare (`$parameter["company"]`, not
			// `.value`): that auto-applies "By URL"'s `extractValue`.
			url: '=/companies/{{ $parameter["company"] }}',
			ignoreHttpStatusErrors: true,
		},
		send: {
			preSend: [resolveCompanyRequest],
		},
		output: {
			postReceive: [suppressNotFound, unwrapDataEnvelope],
		},
	},
};
