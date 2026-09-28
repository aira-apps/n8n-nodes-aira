import type { IAuthenticateGeneric, ICredentialTestRequest, ICredentialType, INodeProperties } from 'n8n-workflow';
export declare class AiraApi implements ICredentialType {
    name: string;
    displayName: string;
    documentationUrl: string;
    icon: {
        readonly light: 'file:../nodes/Aira/aira.svg';
        readonly dark: 'file:../nodes/Aira/aira.dark.svg';
    };
    properties: INodeProperties[];
    authenticate: IAuthenticateGeneric;
    test: ICredentialTestRequest;
}
