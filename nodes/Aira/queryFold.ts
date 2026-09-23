import { QUERY_FIELDS } from '../../generated/vocabulary';

/**
 * Folds the filter panel's flat predicate rows into the Connect API's query tree
 * (PIN-6283). Named exports, wired into the `preSend` that builds the search body —
 * following `GetCompany.ts`'s Seam 1b shape so this logic is tested directly rather than
 * through a routing block. See `MAINTAINING.md`.
 *
 * Flat rows always fold to a single `and`; `or` and `not` are reachable only through the
 * AQL string under Options — see `Aira.node.ts`'s `search` operation for why nested groups
 * were rejected on rendering.
 */

export type PredicateRow = {
	field: string;
	operator: string;
	/** As entered in the panel: a number-type control yields a number, everything else a string. */
	value: string | number;
};

export type QueryLeaf = { field: string; operator: string; value: unknown };
export type QueryNode = QueryLeaf | { and: QueryNode[] };

function findField(name: string) {
	const field = QUERY_FIELDS.find(candidate => candidate.name === name);
	if (!field) {
		throw new Error(`Unknown Aira filter field "${name}".`);
	}
	return field;
}

function splitList(raw: string): string[] {
	return raw
		.split(',')
		.map(value => value.trim())
		.filter(value => value.length > 0);
}

/**
 * Parse one row's entered value against its field's vocabulary entry.
 *
 * `operator: 'in'` always needs a list (only `id` ever offers it). Otherwise a field that
 * `acceptsValueList` treats a comma inside the entered text as "any of these" — matching
 * `compileCompanyQuery`'s own array handling — and everything else is a scalar: a number
 * for a `number`-typed field, the trimmed string otherwise.
 */
export function parsePredicateValue(
	fieldName: string,
	operator: string,
	raw: string | number
): unknown {
	const field = findField(fieldName);

	if (operator === 'in') {
		if (typeof raw !== 'string') {
			throw new Error(
				`"${field.label}" with "Is One Of" needs a comma-separated list of values.`
			);
		}
		return splitList(raw);
	}

	if (field.valueType.kind === 'number') {
		// ⚠️ `Number('')` is `0`, not NaN — an empty string reaching here from an
		// expression (e.g. a missing upstream field) would otherwise silently become a
		// real threshold rather than a missing one. Rejected before it can compile.
		const value = typeof raw === 'number' ? raw : Number(raw);
		if (!Number.isFinite(value) || (typeof raw === 'string' && raw.trim() === '')) {
			throw new Error(`"${field.label}" needs a valid number.`);
		}
		return value;
	}

	if (typeof raw === 'string') {
		if (field.acceptsValueList && raw.includes(',')) {
			return splitList(raw);
		}
		return raw.trim();
	}

	return raw;
}

/**
 * Fold the panel's rows into `{ and: [...] }`. Throws rather than sending an empty query —
 * the API would reject it as `query_invalid` anyway, but with no path back to the row that
 * caused it.
 */
export function foldPredicateRows(rows: PredicateRow[]): QueryNode {
	if (rows.length === 0) {
		throw new Error('Add at least one filter row, or set a query under Options → AQL Query.');
	}

	return {
		and: rows.map(
			(row): QueryLeaf => ({
				field: row.field,
				operator: row.operator,
				value: parsePredicateValue(row.field, row.operator, row.value),
			})
		),
	};
}
