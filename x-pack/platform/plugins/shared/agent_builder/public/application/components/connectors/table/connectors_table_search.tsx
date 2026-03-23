/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { Search } from '@elastic/eui';
import { countBy } from 'lodash';
import React, { useMemo } from 'react';
import { useListConnectors } from '../../../hooks/tools/use_mcp_connectors';
import { useKibana } from '../../../hooks/use_kibana';
import { labels } from '../../../utils/i18n';
import { FilterOptionWithMatchesBadge } from '../../common/filter_option_with_matches_badge';

export const useConnectorsTableSearch = (): Search => {
  const { connectors } = useListConnectors({});
  const {
    services: {
      plugins: { triggersActionsUi },
    },
  } = useKibana();
  const { actionTypeRegistry } = triggersActionsUi;

  const typeOptions = useMemo(() => {
    const matchesByType = countBy(connectors, (c) => c.actionTypeId);
    return Object.keys(matchesByType).map((actionTypeId) => {
      const typeName = actionTypeRegistry.has(actionTypeId)
        ? actionTypeRegistry.get(actionTypeId).actionTypeTitle ?? actionTypeId
        : actionTypeId;
      return {
        value: actionTypeId,
        name: typeName,
        view: (
          <FilterOptionWithMatchesBadge
            name={typeName}
            matches={matchesByType[actionTypeId] ?? 0}
          />
        ),
      };
    });
  }, [connectors, actionTypeRegistry]);

  return useMemo(
    () => ({
      box: {
        incremental: true,
        placeholder: labels.connectors.searchConnectorsPlaceholder,
        'data-test-subj': 'agentBuilderConnectorsSearchInput',
      },
      filters: [
        {
          type: 'field_value_selection',
          field: 'actionTypeId',
          name: labels.connectors.typeFilter,
          multiSelect: 'or',
          options: typeOptions,
          autoSortOptions: false,
          searchThreshold: 1,
        },
      ],
    }),
    [typeOptions]
  );
};
