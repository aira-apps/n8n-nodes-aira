import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

import { AIRA_CONNECT_BASE_URL } from '../nodes/Aira/constants';

/**
 * API-key credential for Aira Connect (PIN-6282).
 *
 * One field, no OAuth, no host/region/environment picker — Connect has exactly one
 * base URL, and a key is issued for one organization. `test` hits `GET /v1/me`, the
 * documented free health check: it costs nothing to press Test as often as needed.
 */
export class AiraApi implements ICredentialType {
	name = 'airaApi';

	displayName = 'Aira API';

	// ⚠️ Not yet the published docs site — see MAINTAINING.md. Points at the live API root
	// until `apps/docs`'s actual production hostname is confirmed (no reference to it
	// exists anywhere else in the repo to copy from).
	documentationUrl = 'https://ai.aira.app/api';

	icon = {
		light: 'file:../nodes/Aira/aira.svg',
		dark: 'file:../nodes/Aira/aira.dark.svg',
	} as const;

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description:
				'An Aira Connect API key, issued in Connect settings. Prefixed `aira_live_…`.',
		},
		{
			// Repeated verbatim in README.md — one fact, one phrasing, in both places.
			displayName:
				'This key is unscoped: it can do anything the Aira Connect API can, not only what this node uses. Only an organization owner or admin can create one, in Connect settings.',
			name: 'notice',
			type: 'notice',
			default: '',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: AIRA_CONNECT_BASE_URL,
			url: '/me',
			method: 'GET',
		},
	};
}
