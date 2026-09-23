export type PredicateRow = {
    field: string;
    operator: string;
    value: string | number;
};
export type QueryLeaf = {
    field: string;
    operator: string;
    value: unknown;
};
export type QueryNode = QueryLeaf | {
    and: QueryNode[];
};
export declare function parsePredicateValue(fieldName: string, operator: string, raw: string | number): unknown;
export declare function foldPredicateRows(rows: PredicateRow[]): QueryNode;
