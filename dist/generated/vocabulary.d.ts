export declare const QUERY_FIELDS: readonly [{
    readonly name: 'id';
    readonly label: 'Id';
    readonly cdhAttribute: 'prospectingId';
    readonly description: 'Company id. Accepts a single `cmp_` id (`eq`) or a batch (`in`, up to 500). Naming companies by id suppresses the product defaults, so a branch office or a dissolved company addressed by id is returned.';
    readonly operators: readonly ['eq', 'in'];
    readonly valueType: {
        readonly kind: 'string';
    };
    readonly acceptsValueList: true;
    readonly minLength: null;
}, {
    readonly name: 'org_number';
    readonly label: 'Organization Number';
    readonly cdhAttribute: 'orgNumber';
    readonly description: 'National registration number, exact match.';
    readonly operators: readonly ['eq'];
    readonly valueType: {
        readonly kind: 'string';
    };
    readonly acceptsValueList: false;
    readonly minLength: null;
}, {
    readonly name: 'country';
    readonly label: 'Country';
    readonly cdhAttribute: 'countryCode';
    readonly description: 'ISO 3166-1 alpha-2 country code, and only a market Aira covers. One country per search: a query naming two is rejected.';
    readonly operators: readonly ['eq'];
    readonly valueType: {
        readonly kind: 'string';
    };
    readonly acceptsValueList: true;
    readonly minLength: null;
}, {
    readonly name: 'name';
    readonly label: 'Name';
    readonly cdhAttribute: 'name';
    readonly description: 'Company name. `starts_with` and `contains` need at least 3 characters.';
    readonly operators: readonly ['eq', 'starts_with', 'contains'];
    readonly valueType: {
        readonly kind: 'string';
    };
    readonly acceptsValueList: false;
    readonly minLength: {
        readonly operators: readonly ['starts_with', 'contains'];
        readonly min: 3;
    };
}, {
    readonly name: 'city';
    readonly label: 'City';
    readonly cdhAttribute: 'city';
    readonly description: 'Registered postal town. `starts_with` needs at least 2 characters. Coverage is uneven by market; see the `city` field on the company resource.';
    readonly operators: readonly ['eq', 'neq', 'starts_with'];
    readonly valueType: {
        readonly kind: 'string';
    };
    readonly acceptsValueList: true;
    readonly minLength: {
        readonly operators: readonly ['starts_with'];
        readonly min: 2;
    };
}, {
    readonly name: 'region';
    readonly label: 'Region';
    readonly cdhAttribute: 'region';
    readonly description: 'Administrative region. Unpopulated in NO, DK, FI, GB, DE, BE, IE and LU. `starts_with` needs at least 2 characters.';
    readonly operators: readonly ['eq', 'neq', 'starts_with'];
    readonly valueType: {
        readonly kind: 'string';
    };
    readonly acceptsValueList: true;
    readonly minLength: {
        readonly operators: readonly ['starts_with'];
        readonly min: 2;
    };
}, {
    readonly name: 'postal_code';
    readonly label: 'Postal Code';
    readonly cdhAttribute: 'postZipcode';
    readonly description: 'Postal code. `starts_with` compiles to a prefix range, so a partial code such as `RG` selects a whole postal area.';
    readonly operators: readonly ['eq', 'starts_with', 'gte', 'lte'];
    readonly valueType: {
        readonly kind: 'string';
    };
    readonly acceptsValueList: true;
    readonly minLength: null;
}, {
    readonly name: 'status';
    readonly label: 'Status';
    readonly cdhAttribute: 'status';
    readonly description: 'Registry status. `active` and `inactive` account for effectively the whole corpus; the rest are `bankruptcy`, `bankruptcy_completed`, `bankruptcy_ongoing`, `fusion_ongoing`, `liquidated`, `liquidation_ongoing`, `merged`, `reconstruction_ongoing`, `shell_corporation`, `other` and `unknown`. Defaults to `active` when your query does not mention it; naming it overrides that default.';
    readonly operators: readonly ['eq', 'neq'];
    readonly valueType: {
        readonly kind: 'string';
    };
    readonly acceptsValueList: true;
    readonly minLength: null;
}, {
    readonly name: 'website';
    readonly label: 'Website';
    readonly cdhAttribute: 'website';
    readonly description: 'Primary website domain, without scheme (e.g. `volvo.com`).';
    readonly operators: readonly ['eq', 'starts_with'];
    readonly valueType: {
        readonly kind: 'string';
    };
    readonly acceptsValueList: false;
    readonly minLength: null;
}, {
    readonly name: 'nace_code';
    readonly label: 'NACE Code';
    readonly cdhAttribute: 'naceCode';
    readonly description: 'NACE / SNI industry code, almost always stored WITHOUT separators (`6202`, not `62.02`) and at a depth that varies by registry: one activity is filed as 4 characters in some markets and 5 in others, sometimes with a letter suffix — computer consultancy appears as `6202`, `62020` and `6202A`. So `starts_with` is a raw prefix with two consequences: a dotted value matches almost nothing, and a prefix longer than 2 characters excludes the other spellings of the same activity. Prefix on the 2-character division (`62` for IT services) and filter the result further, rather than naming a precise code and reading a short answer as a small industry. A dotted form exists on a few thousand records out of tens of millions; reach those with `eq` on the exact value, never with a dotted prefix.';
    readonly operators: readonly ['eq', 'starts_with'];
    readonly valueType: {
        readonly kind: 'string';
    };
    readonly acceptsValueList: true;
    readonly minLength: {
        readonly operators: readonly ['starts_with'];
        readonly min: 2;
    };
}, {
    readonly name: 'industry_tags';
    readonly label: 'Industry Tags';
    readonly cdhAttribute: 'industryTags';
    readonly description: 'Our derived industry tags, from a closed vocabulary — an unknown value is refused and the refusal lists every valid tag. Populated on only a few per cent of companies, so a query filtering on them returns a small fraction of the companies that actually match: useful as a positive filter, misleading as a negative one, and the wrong tool for an industry that has a `nace_code` prefix.';
    readonly operators: readonly ['eq', 'neq'];
    readonly valueType: {
        readonly kind: 'string';
    };
    readonly acceptsValueList: true;
    readonly minLength: null;
}, {
    readonly name: 'size_tier';
    readonly label: 'Size Tier';
    readonly cdhAttribute: 'sizeTier';
    readonly description: 'EU SME size tier (2003/361/EC): `micro`, `small`, `medium` or `large`. Null on a company we cannot tier, which is the majority, so this is a positive filter rather than a way to partition the corpus.';
    readonly operators: readonly ['eq', 'neq'];
    readonly valueType: {
        readonly kind: 'enum';
        readonly values: readonly ['micro', 'small', 'medium', 'large'];
    };
    readonly acceptsValueList: true;
    readonly minLength: null;
}, {
    readonly name: 'year_founded';
    readonly label: 'Year Founded';
    readonly cdhAttribute: 'yearFounded';
    readonly description: 'Year of incorporation.';
    readonly operators: readonly ['eq', 'neq', 'gt', 'gte', 'lt', 'lte'];
    readonly valueType: {
        readonly kind: 'number';
    };
    readonly acceptsValueList: false;
    readonly minLength: null;
}, {
    readonly name: 'employees';
    readonly label: 'Employees';
    readonly cdhAttribute: 'employees';
    readonly description: 'Headcount. Filterable everywhere, including the DE and DK companies whose record returns `employees: null` and a band: the filter reads the stored figure behind the band, matching on overlap. So a company can match a range its record does not show.';
    readonly operators: readonly ['eq', 'neq', 'gt', 'gte', 'lt', 'lte'];
    readonly valueType: {
        readonly kind: 'number';
    };
    readonly acceptsValueList: false;
    readonly minLength: null;
}, {
    readonly name: 'revenue';
    readonly label: 'Revenue';
    readonly cdhAttribute: 'revenue';
    readonly description: 'Revenue in the company’s own reporting currency, full units. Includes modelled revenue where we hold no filed figure; the company record separates the two into `revenue` and `estimated_revenue`.';
    readonly operators: readonly ['eq', 'neq', 'gt', 'gte', 'lt', 'lte'];
    readonly valueType: {
        readonly kind: 'number';
    };
    readonly acceptsValueList: false;
    readonly minLength: null;
}, {
    readonly name: 'profit';
    readonly label: 'Profit';
    readonly cdhAttribute: 'profit';
    readonly description: 'Profit, local currency, full units.';
    readonly operators: readonly ['eq', 'neq', 'gt', 'gte', 'lt', 'lte'];
    readonly valueType: {
        readonly kind: 'number';
    };
    readonly acceptsValueList: false;
    readonly minLength: null;
}, {
    readonly name: 'ebitda';
    readonly label: 'EBITDA';
    readonly cdhAttribute: 'ebitda';
    readonly description: 'EBITDA, local currency, full units.';
    readonly operators: readonly ['eq', 'neq', 'gt', 'gte', 'lt', 'lte'];
    readonly valueType: {
        readonly kind: 'number';
    };
    readonly acceptsValueList: false;
    readonly minLength: null;
}, {
    readonly name: 'equity';
    readonly label: 'Equity';
    readonly cdhAttribute: 'equity';
    readonly description: 'Total equity, local currency, full units. The company record calls the same figure `total_equity`.';
    readonly operators: readonly ['eq', 'neq', 'gt', 'gte', 'lt', 'lte'];
    readonly valueType: {
        readonly kind: 'number';
    };
    readonly acceptsValueList: false;
    readonly minLength: null;
}, {
    readonly name: 'cash_and_bank';
    readonly label: 'Cash And Bank';
    readonly cdhAttribute: 'cashAndBank';
    readonly description: 'Cash and bank balances, local currency, full units.';
    readonly operators: readonly ['eq', 'neq', 'gt', 'gte', 'lt', 'lte'];
    readonly valueType: {
        readonly kind: 'number';
    };
    readonly acceptsValueList: false;
    readonly minLength: null;
}, {
    readonly name: 'profit_margin_pct';
    readonly label: 'Profit Margin %';
    readonly cdhAttribute: 'profitMargin';
    readonly description: 'Profit margin, percent.';
    readonly operators: readonly ['eq', 'neq', 'gt', 'gte', 'lt', 'lte'];
    readonly valueType: {
        readonly kind: 'number';
    };
    readonly acceptsValueList: false;
    readonly minLength: null;
}, {
    readonly name: 'ebitda_margin_pct';
    readonly label: 'EBITDA Margin %';
    readonly cdhAttribute: 'ebitdaMargin';
    readonly description: 'EBITDA margin, percent.';
    readonly operators: readonly ['eq', 'neq', 'gt', 'gte', 'lt', 'lte'];
    readonly valueType: {
        readonly kind: 'number';
    };
    readonly acceptsValueList: false;
    readonly minLength: null;
}, {
    readonly name: 'equity_ratio_pct';
    readonly label: 'Equity Ratio %';
    readonly cdhAttribute: 'equityRatioPct';
    readonly description: 'Equity ratio, percent.';
    readonly operators: readonly ['eq', 'neq', 'gt', 'gte', 'lt', 'lte'];
    readonly valueType: {
        readonly kind: 'number';
    };
    readonly acceptsValueList: false;
    readonly minLength: null;
}, {
    readonly name: 'revenue_growth_pct';
    readonly label: 'Revenue Growth %';
    readonly cdhAttribute: 'revenueGrowthPct';
    readonly description: 'Year-over-year revenue change, percent.';
    readonly operators: readonly ['eq', 'neq', 'gt', 'gte', 'lt', 'lte'];
    readonly valueType: {
        readonly kind: 'number';
    };
    readonly acceptsValueList: false;
    readonly minLength: null;
}, {
    readonly name: 'revenue_growth_streak';
    readonly label: 'Revenue Growth Streak (Years)';
    readonly cdhAttribute: 'revenueGrowthStreak';
    readonly description: 'Consecutive years of revenue growth.';
    readonly operators: readonly ['eq', 'neq', 'gt', 'gte', 'lt', 'lte'];
    readonly valueType: {
        readonly kind: 'number';
    };
    readonly acceptsValueList: false;
    readonly minLength: null;
}, {
    readonly name: 'employee_growth_pct';
    readonly label: 'Employee Growth %';
    readonly cdhAttribute: 'employeeGrowth';
    readonly description: 'Year-over-year headcount change, percent.';
    readonly operators: readonly ['eq', 'neq', 'gt', 'gte', 'lt', 'lte'];
    readonly valueType: {
        readonly kind: 'number';
    };
    readonly acceptsValueList: false;
    readonly minLength: null;
}];
export type QueryFieldName = (typeof QUERY_FIELDS)[number]['name'];
export declare const OPERATOR_LABELS: {
    readonly eq: 'Equals';
    readonly neq: 'Does Not Equal';
    readonly gt: 'Greater Than';
    readonly gte: 'Greater Than Or Equal To';
    readonly lt: 'Less Than';
    readonly lte: 'Less Than Or Equal To';
    readonly starts_with: 'Starts With';
    readonly contains: 'Contains';
    readonly in: 'Is One Of';
};
