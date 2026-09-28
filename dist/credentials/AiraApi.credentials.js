"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiraApi = void 0;
const constants_1 = require("../nodes/Aira/constants");
class AiraApi {
    constructor() {
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'airaApi'
        });
        Object.defineProperty(this, "displayName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'Aira API'
        });
        Object.defineProperty(this, "documentationUrl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'https://ai.aira.app/api'
        });
        Object.defineProperty(this, "icon", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {
                light: 'file:../nodes/Aira/aira.svg',
                dark: 'file:../nodes/Aira/aira.dark.svg',
            }
        });
        Object.defineProperty(this, "properties", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: [
                {
                    displayName: 'API Key',
                    name: 'apiKey',
                    type: 'string',
                    typeOptions: { password: true },
                    default: '',
                    required: true,
                    description: 'An Aira Connect API key, issued in Connect settings. Prefixed `aira_live_…`.',
                },
                {
                    displayName: 'This key is unscoped: it can do anything the Aira Connect API can, not only what this node uses. Only an organization owner or admin can create one, in Connect settings.',
                    name: 'notice',
                    type: 'notice',
                    default: '',
                },
            ]
        });
        Object.defineProperty(this, "authenticate", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {
                type: 'generic',
                properties: {
                    headers: {
                        Authorization: '=Bearer {{$credentials.apiKey}}',
                    },
                },
            }
        });
        Object.defineProperty(this, "test", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {
                request: {
                    baseURL: constants_1.AIRA_CONNECT_BASE_URL,
                    url: '/me',
                    method: 'GET',
                },
            }
        });
    }
}
exports.AiraApi = AiraApi;
//# sourceMappingURL=AiraApi.credentials.js.map