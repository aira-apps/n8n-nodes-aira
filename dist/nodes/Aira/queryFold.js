"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePredicateValue = parsePredicateValue;
exports.foldPredicateRows = foldPredicateRows;
const vocabulary_1 = require("../../generated/vocabulary");
function findField(name) {
    const field = vocabulary_1.QUERY_FIELDS.find(candidate => candidate.name === name);
    if (!field) {
        throw new Error(`Unknown Aira filter field "${name}".`);
    }
    return field;
}
function splitList(raw) {
    return raw
        .split(',')
        .map(value => value.trim())
        .filter(value => value.length > 0);
}
function parsePredicateValue(fieldName, operator, raw) {
    const field = findField(fieldName);
    if (operator === 'in') {
        if (typeof raw !== 'string') {
            throw new Error(`"${field.label}" with "Is One Of" needs a comma-separated list of values.`);
        }
        return splitList(raw);
    }
    if (field.valueType.kind === 'number') {
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
function foldPredicateRows(rows) {
    if (rows.length === 0) {
        throw new Error('Add at least one filter row, or set a query under Options → AQL Query.');
    }
    return {
        and: rows.map((row) => ({
            field: row.field,
            operator: row.operator,
            value: parsePredicateValue(row.field, row.operator, row.value),
        })),
    };
}
//# sourceMappingURL=queryFold.js.map