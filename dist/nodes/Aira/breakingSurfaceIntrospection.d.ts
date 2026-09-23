export type N8nNodeOperationSurface = {
    name: string;
    action: string;
    parameters: string[];
};
export declare function readN8nNodeOperationSurface(): N8nNodeOperationSurface[];
export type N8nSurfaceStalenessViolation = {
    location: string;
    detail: string;
};
export declare function findN8nSurfaceStaleness(handMaintained: {
    operations: {
        name: string;
        action: string;
        parameters: string[];
    }[];
}, real: N8nNodeOperationSurface[]): N8nSurfaceStalenessViolation[];
