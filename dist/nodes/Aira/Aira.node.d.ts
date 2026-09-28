import type { INodeType, INodeTypeDescription } from 'n8n-workflow';
import { searchSavedViews } from './GetSavedView';
import { getOperatorsForField } from './SearchCompanies';
export declare class Aira implements INodeType {
    description: INodeTypeDescription;
    methods: {
        loadOptions: {
            getOperatorsForField: typeof getOperatorsForField;
        };
        listSearch: {
            searchSavedViews: typeof searchSavedViews;
        };
    };
}
