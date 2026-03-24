/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { EuiBasicTableColumn } from '@elastic/eui';
import { EuiFlexGroup, EuiFlexItem, EuiLink, EuiText } from '@elastic/eui';
import React, { useMemo } from 'react';
import type { ConnectorItem } from '../../../../../common/http_api/tools';
import { useConnectorsActions } from '../../../context/connectors_provider';
import { useKibana } from '../../../hooks/use_kibana';
import { labels } from '../../../utils/i18n';
import { ConnectorTypeIcon } from '../connector_type_icon';
import { ConnectorContextMenu } from './connectors_table_context_menu';
import { ConnectorQuickActions } from './connectors_table_quick_actions';

export const useConnectorsTableColumns = (): Array<EuiBasicTableColumn<ConnectorItem>> => {
  const { editConnector } = useConnectorsActions();
  const {
    services: { application },
  } = useKibana();
  const canDelete = application.capabilities.actions?.delete === true;
  const {
    services: {
      plugins: { triggersActionsUi },
    },
  } = useKibana();

  const { actionTypeRegistry } = triggersActionsUi;

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
        render: (actionTypeId: string) => {
          const typeName = actionTypeRegistry.has(actionTypeId)
            ? actionTypeRegistry.get(actionTypeId).actionTypeTitle ?? actionTypeId
            : actionTypeId;

          return (
            <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
              <EuiFlexItem grow={false}>
                <ConnectorTypeIcon actionTypeId={actionTypeId} />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiText size="s">{typeName}</EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
          );
        },
      },
      {
        width: '100px',
        align: 'right',
        render: (connector: ConnectorItem) => (
          <EuiFlexGroup gutterSize="s" justifyContent="flexEnd" alignItems="center">
            {canDelete && <ConnectorQuickActions connector={connector} />}
            <ConnectorContextMenu connector={connector} />
          </EuiFlexGroup>
        ),
      },
    ],
    [editConnector, actionTypeRegistry, canDelete]
  );
};
