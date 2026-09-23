import type { INode, JsonObject } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

/**
 * Error mapping for the three list operations (PIN-6283).
 *
 * `daily_row_limit_exceeded` and `rate_limit_exceeded` are hard-coded here rather than
 * read from the response body's `error.message`: the REST error body carries neither a
 * `retry_class` nor a `resetAt` (both are MCP-only — see `errors.ts` in
 * `apps/web/server/connectApi`), and the ceiling's number must never appear on the wire a
 * workflow author reads. Nothing changes Aira-side to support this; the copy lives only
 * here.
 *
 * ⚠️ NO `failure`/`cause` DECLARATION. The ticket asks for one "where the runtime supports
 * it" — n8n-workflow@2.16.0's public `NodeApiError`/`NodeOperationError` surface has no
 * typed cause/quota field to attach one to (checked against the installed package's
 * `.d.ts`), so this throws a plain `NodeApiError` with prose instead. Revisit if a later
 * `n8n-workflow` bump adds one.
 */

interface ConnectErrorBody {
	error?: { code?: string; message?: string };
}

const DAILY_ROW_LIMIT_MESSAGE =
	'Your organization reached its daily limit for company records. The limit is counted across every endpoint that returns companies and resets at midnight UTC. This page was discarded rather than partially delivered — resume the workflow after the reset, or talk to your account manager about a bigger daily allowance for a scheduled import.';

const RATE_LIMIT_MESSAGE =
	'Your organization is sending requests to the Aira Connect API faster than it allows right now. Wait a moment, then run this workflow again.';

/**
 * Throws on any non-2xx response, translating the two volume-related codes into Aira's
 * own words and everything else into a generic `NodeApiError`. A named export so the
 * paginator can call it without owning the mapping itself — see `GetCompany.ts`'s
 * `suppressNotFound` for the same shape.
 */
export function throwOnErrorResponse(node: INode, statusCode: number, body: unknown): void {
	if (statusCode < 400) return;

	const errorBody = body as ConnectErrorBody | undefined;
	const code = errorBody?.error?.code;

	if (code === 'daily_row_limit_exceeded') {
		throw new NodeApiError(node, (body ?? {}) as JsonObject, {
			message: DAILY_ROW_LIMIT_MESSAGE,
			httpCode: String(statusCode),
		});
	}

	if (code === 'rate_limit_exceeded') {
		throw new NodeApiError(node, (body ?? {}) as JsonObject, {
			message: RATE_LIMIT_MESSAGE,
			httpCode: String(statusCode),
		});
	}

	throw new NodeApiError(node, (body ?? {}) as JsonObject, {
		message: errorBody?.error?.message ?? `Aira API request failed with status ${statusCode}`,
		httpCode: String(statusCode),
	});
}
