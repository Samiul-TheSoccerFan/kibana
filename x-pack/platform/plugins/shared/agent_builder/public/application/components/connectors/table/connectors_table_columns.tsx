/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { EuiBasicTableColumn } from '@elastic/eui';
import { EuiFlexGroup, EuiFlexItem, EuiLink, EuiLoadingSpinner, EuiText } from '@elastic/eui';
import { WORKFLOWS_APP_ID } from '@kbn/deeplinks-workflows';
import { trimStart } from 'lodash';
import React, { useMemo } from 'react';
import type { ConnectorItem } from '../../../../../common/http_api/tools';
import { slugify } from '../../../../../common/utils/slugify';
import { useConnectorsActions } from '../../../context/connectors_provider';
import { useKibana } from '../../../hooks/use_kibana';
import { labels } from '../../../utils/i18n';
import { ConnectorTypeIcon } from '../connector_type_icon';
import { ConnectorContextMenu } from './connectors_table_context_menu';
import { ConnectorQuickActions } from './connectors_table_quick_actions';

function getWorkflowQueryPrefix(connector: ConnectorItem): string {
  const connectorTypeKey = trimStart(connector.actionTypeId, '.');
  return `${connectorTypeKey}.${slugify(connector.name)}`;
}

export const useConnectorsTableColumns = (): Array<EuiBasicTableColumn<ConnectorItem>> => {
  const { editConnector, isConnectorResourcesPending } = useConnectorsActions();
  const {
    services: {
      application,
      plugins: { triggersActionsUi },
    },
  } = useKibana();
  const canDelete = application.capabilities.actions?.delete === true;
  const { actionTypeRegistry } = triggersActionsUi;

  return useMemo(
    () => [
      {
        field: 'name',
        name: labels.connectors.nameColumn,
        width: '40%',
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
        width: '15%',
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
        field: 'workflowsCount',
        name: labels.connectors.workflowsColumn,
        width: '15%',
        align: 'center',
        render: (workflowsCount: number | null, connector: ConnectorItem) => {
          // null + pending = lifecycle handler still running, show spinner
          // null + not pending = timeout occurred, show 0
          if (workflowsCount === null) {
            if (isConnectorResourcesPending(connector.id)) {
              return <EuiLoadingSpinner size="s" />;
            }
            return <EuiText size="s">0</EuiText>;
          }
          const query = getWorkflowQueryPrefix(connector);
          const workflowsUrl = application.getUrlForApp(WORKFLOWS_APP_ID, {
            path: `?query=${encodeURIComponent(query)}`,
          });
          return (
            <EuiLink
              href={workflowsUrl}
              data-test-subj={`agentBuilderConnectorsWorkflowsLink-${connector.id}`}
            >
              <EuiText size="s">{workflowsCount}</EuiText>
            </EuiLink>
          );
        },
      },
      {
        field: 'oauthStatus',
        name: labels.connectors.statusColumn,
        width: '15%',
        render: (oauthStatus: ConnectorItem['oauthStatus']) => {
          if (!oauthStatus) return null;
          return (
            <EuiText size="s" color={oauthStatus === 'authorized' ? 'success' : 'subdued'}>
              {oauthStatus === 'authorized'
                ? labels.connectors.statusAuthorized
                : labels.connectors.statusDisconnected}
            </EuiText>
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
    [editConnector, actionTypeRegistry, canDelete, application, isConnectorResourcesPending]
  );
};
