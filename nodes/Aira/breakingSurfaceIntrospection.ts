import type { INodeProperties, INodePropertyOptions } from 'n8n-workflow';
import { Aira } from './Aira.node';

/**
 * Derives the operation/parameter half of `apps/n8n/breakingSurface.json` straight from the
 * real `Aira` node description, so a rename inside `Aira.node.ts` that nobody mirrors into the
 * hand-maintained file fails CI instead of passing silently (PIN-6284 code review finding).
 *
 * Lives here, in `apps/n8n`'s own workspace, rather than alongside `appDiff.ts` under
 * `apps/web/server/connectApi/integrations/n8n/` — that module has no `n8n-workflow` dependency
 * and type-checks cleanly under `apps/web`'s own `tsc`. This one imports the real `Aira` class
 * and its `n8n-workflow` types, which `apps/web`'s tsconfig has no visibility into; putting it
 * there broke `pnpm --filter web check-types` outright. `scripts/connectApi/checkN8nAppBreaking.ts`
 * (run via `pnpm --filter web exec tsx`, same as every other `connect-n8n:*`/`connect-zapier:*`
 * script) imports this file directly — `tsx` transpiles without type-checking, and `scripts/` is
 * outside both workspaces' `tsc` `include`, so the cross-workspace import is safe there the same
 * way `n8nMirrorSnapshot.ts` already reads real files out of `apps/n8n` today.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Why this doesn't replace `breakingSurface.json`, only validates it
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Operations and their top-level parameter NAMES live in `Aira.node.ts`'s `description`, so
 * they're introspectable at runtime — this module reads them straight off a real `INodeType`
 * instance, the same object n8n itself loads. Output FIELD names are not: n8n has no equivalent
 * of Zapier's declared output-field schema, so a Get Company response's shape exists only in
 * what the Connect API actually returns, not in anything `Aira.node.ts` declares. There is
 * nothing here to introspect output fields from without making an HTTP call, so
 * `breakingSurface.json`'s `outputFields` arrays stay hand-maintained, reviewed by a human in
 * the PR that changes them — this module only closes the operations/parameters half of the gap.
 */

export type N8nNodeOperationSurface = {
	name: string;
	action: string;
	parameters: string[];
};

function isPropertyOptions(option: unknown): option is INodePropertyOptions {
	return typeof option === 'object' && option !== null && 'value' in option;
}

/**
 * A `collection`-typed property (the two `Options` groups) is expanded into dotted
 * `<property>.<suboption>` paths, matching `breakingSurface.json`'s `options.outputCursor`
 * shape. Every other property type (`resourceLocator`, `fixedCollection`, plain controls)
 * contributes its own bare name — `predicates` stays `predicates`, not expanded into its
 * per-row field names, matching how the hand-maintained file already lists it.
 */
function parameterNamesFor(property: INodeProperties): string[] {
	if (property.type === 'collection' && Array.isArray(property.options)) {
		return property.options
			.filter(
				(option): option is INodeProperties =>
					'name' in option && !isPropertyOptions(option)
			)
			.map(sub => `${property.name}.${sub.name}`);
	}
	return [property.name];
}

function operationValuesFor(property: INodeProperties): string[] | undefined {
	const show = property.displayOptions?.show as Record<string, unknown> | undefined;
	const operation = show?.operation;
	return Array.isArray(operation) ? operation.map(String) : undefined;
}

/**
 * Reads the real node description and returns one entry per declared operation, with its
 * `action` string and the top-level parameter names shown for it — the exact shape
 * `breakingSurface.json`'s `operations[]` entries carry, minus `outputFields`.
 */
export function readN8nNodeOperationSurface(): N8nNodeOperationSurface[] {
	const { properties } = new Aira().description;

	const operationProperty = properties.find(property => property.name === 'operation');
	if (!operationProperty || !Array.isArray(operationProperty.options)) {
		throw new Error(
			"Aira.node.ts's `operation` property is missing or has no `options` — " +
				"breakingSurfaceIntrospection.ts can't introspect operations at all. This should never " +
				'happen outside a broken node description; if the node genuinely no longer has an ' +
				'`operation` dropdown, this module needs to be rewritten for whatever replaced it.'
		);
	}

	return operationProperty.options.filter(isPropertyOptions).map(option => {
		const parameters = properties
			.filter(property => operationValuesFor(property)?.includes(String(option.value)))
			.flatMap(parameterNamesFor);

		return {
			name: String(option.value),
			action: option.action ?? '',
			parameters,
		};
	});
}

export type N8nSurfaceStalenessViolation = { location: string; detail: string };

/**
 * What `connect-n8n:check-breaking` asserts BEFORE diffing `breakingSurface.json` against the
 * base ref — that the committed file still agrees with the real node, not just with git history.
 * Without this, a dev can rename a parameter in `Aira.node.ts`, forget to mirror it into
 * `breakingSurface.json` (an instruction in `MAINTAINING.md`, not an enforcement), and the diff
 * step finds nothing wrong because BOTH commits it compares carry the same stale file.
 *
 * Silent on an operation or parameter the real node has that the hand file doesn't yet mention —
 * that's simply a PR in progress, not staleness the gate should block on. It fails only when the
 * hand file claims something the real node no longer has, which is exactly the rename-drift case.
 */
export function findN8nSurfaceStaleness(
	handMaintained: { operations: { name: string; action: string; parameters: string[] }[] },
	real: N8nNodeOperationSurface[]
): N8nSurfaceStalenessViolation[] {
	const realByName = new Map(real.map(operation => [operation.name, operation]));
	const violations: N8nSurfaceStalenessViolation[] = [];

	for (const handOperation of handMaintained.operations) {
		const realOperation = realByName.get(handOperation.name);
		if (!realOperation) {
			violations.push({
				location: handOperation.name,
				detail:
					'breakingSurface.json declares this operation, but Aira.node.ts no longer has it. ' +
					'Update breakingSurface.json in this PR (see its own $comment for how).',
			});
			continue;
		}

		// NOT checked here: `action`. It's presentation text shown in the operation dropdown, not
		// part of the saved-workflow contract `check-breaking` exists to protect — the gate's own
		// scope (per the ticket and this file's header) is output fields and operation/parameter
		// NAMES. Asserting on it would block CI for a copy-only edit that breaks nothing.

		const realParameters = new Set(realOperation.parameters);
		for (const parameter of handOperation.parameters) {
			if (realParameters.has(parameter)) continue;
			violations.push({
				location: `${handOperation.name}.${parameter}`,
				detail:
					'breakingSurface.json declares this parameter, but Aira.node.ts no longer shows it ' +
					'for this operation. Update breakingSurface.json in this PR — if the rename is ' +
					'intentional, this is exactly the drift the breaking-change diff needs to see.',
			});
		}
	}

	return violations;
}
