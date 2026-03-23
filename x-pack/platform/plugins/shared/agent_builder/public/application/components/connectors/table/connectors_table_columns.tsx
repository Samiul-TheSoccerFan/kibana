/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { EuiBasicTableColumn } from '@elastic/eui';
import { EuiLink } from '@elastic/eui';
import React, { useMemo } from 'react';
import type { ConnectorItem } from '../../../../../common/http_api/tools';
import { useConnectorsActions } from '../../../context/connectors_provider';
import { labels } from '../../../utils/i18n';

export const useConnectorsTableColumns = (): Array<EuiBasicTableColumn<ConnectorItem>> => {
  const { editConnector } = useConnectorsActions();

  return useMemo(
    () => [
      {
        field: 'name',
        name: labels.connectors.nameColumn,
        sortable: true,
        width: '60%',
        render: (name: string, connector: ConnectorItem) => (
          <EuiLink
            data-test-subj={`agentBuilderConnectorsTableNameLink-${connector.id}`}
            onClick={() => editConnector(connector)}
          >
            {name}
          </EuiLink>
        ),
      },
      {
        field: 'actionTypeId',
        name: labels.connectors.typeColumn,
        sortable: true,
        render: (actionTypeId: string) => actionTypeId,
      },
    ],
    [editConnector]
  );
};
