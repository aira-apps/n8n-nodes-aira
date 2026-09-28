"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readN8nNodeOperationSurface = readN8nNodeOperationSurface;
exports.findN8nSurfaceStaleness = findN8nSurfaceStaleness;
const Aira_node_1 = require("./Aira.node");
function isPropertyOptions(option) {
    return typeof option === 'object' && option !== null && 'value' in option;
}
function parameterNamesFor(property) {
    if (property.type === 'collection' && Array.isArray(property.options)) {
        return property.options
            .filter((option) => 'name' in option && !isPropertyOptions(option))
            .map(sub => `${property.name}.${sub.name}`);
    }
    return [property.name];
}
function operationValuesFor(property) {
    var _a;
    const show = (_a = property.displayOptions) === null || _a === void 0 ? void 0 : _a.show;
    const operation = show === null || show === void 0 ? void 0 : show.operation;
    return Array.isArray(operation) ? operation.map(String) : undefined;
}
function readN8nNodeOperationSurface() {
    const { properties } = new Aira_node_1.Aira().description;
    const operationProperty = properties.find(property => property.name === 'operation');
    if (!operationProperty || !Array.isArray(operationProperty.options)) {
        throw new Error("Aira.node.ts's `operation` property is missing or has no `options` — " +
            "breakingSurfaceIntrospection.ts can't introspect operations at all. This should never " +
            'happen outside a broken node description; if the node genuinely no longer has an ' +
            '`operation` dropdown, this module needs to be rewritten for whatever replaced it.');
    }
    return operationProperty.options.filter(isPropertyOptions).map(option => {
        var _a;
        const parameters = properties
            .filter(property => { var _a; return (_a = operationValuesFor(property)) === null || _a === void 0 ? void 0 : _a.includes(String(option.value)); })
            .flatMap(parameterNamesFor);
        return {
            name: String(option.value),
            action: (_a = option.action) !== null && _a !== void 0 ? _a : '',
            parameters,
        };
    });
}
function findN8nSurfaceStaleness(handMaintained, real) {
    const realByName = new Map(real.map(operation => [operation.name, operation]));
    const violations = [];
    for (const handOperation of handMaintained.operations) {
        const realOperation = realByName.get(handOperation.name);
        if (!realOperation) {
            violations.push({
                location: handOperation.name,
                detail: 'breakingSurface.json declares this operation, but Aira.node.ts no longer has it. ' +
                    'Update breakingSurface.json in this PR (see its own $comment for how).',
            });
            continue;
        }
        const realParameters = new Set(realOperation.parameters);
        for (const parameter of handOperation.parameters) {
            if (realParameters.has(parameter))
                continue;
            violations.push({
                location: `${handOperation.name}.${parameter}`,
                detail: 'breakingSurface.json declares this parameter, but Aira.node.ts no longer shows it ' +
                    'for this operation. Update breakingSurface.json in this PR — if the rename is ' +
                    'intentional, this is exactly the drift the breaking-change diff needs to see.',
            });
        }
    }
    return violations;
}
//# sourceMappingURL=breakingSurfaceIntrospection.js.map