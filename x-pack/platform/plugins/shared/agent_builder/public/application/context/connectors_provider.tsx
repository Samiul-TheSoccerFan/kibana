/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { EuiConfirmModal, EuiText, useGeneratedHtmlId } from '@elastic/eui';
import { FormattedMessage } from '@kbn/i18n-react';
import type { ActionConnector } from '@kbn/alerts-ui-shared';
import { AgentBuilderConnectorFeatureId } from '@kbn/actions-plugin/common';
import { useQueryClient } from '@kbn/react-query';
import type { ConnectorItem } from '../../../common/http_api/tools';
import { useKibana } from '../hooks/use_kibana';
import { useFlyoutState } from '../hooks/use_flyout_state';
import { queryKeys } from '../query_keys';
import { labels } from '../utils/i18n';
import {
  useDeleteConnector,
  useBulkDeleteConnectors,
} from '../hooks/connectors/use_delete_connectors';

const RESOURCE_POLLING_TIMEOUT_MS = 10000;

export const toActionConnector = (c: ConnectorItem): ActionConnector =>
  ({
    id: c.id,
    name: c.name,
    actionTypeId: c.actionTypeId,
    isPreconfigured: c.isPreconfigured,
    isDeprecated: c.isDeprecated,
    isSystemAction: c.isSystemAction,
    isConnectorTypeDeprecated: c.isConnectorTypeDeprecated,
    config: c.config,
    isMissingSecrets: c.isMissingSecrets ?? false,
    authMode: c.authMode,
    secrets: {},
  } as ActionConnector);

export interface ConnectorsActionsContextType {
  openCreateFlyout: () => void;
  editConnector: (connector: ConnectorItem) => void;
  deleteConnector: (connector: ConnectorItem) => void;
  bulkDeleteConnectors: (connectors: ConnectorItem[]) => void;
  isConnectorResourcesPending: (connectorId: string) => boolean;
}

const ConnectorsActionsContext = createContext<ConnectorsActionsContextType | undefined>(undefined);

const DeleteConnectorModalBody = ({
  workflowsCount,
  toolsCount,
}: {
  workflowsCount: number;
  toolsCount: number;
}) => {
  if (workflowsCount > 0 || toolsCount > 0) {
    return (
      <p>
        <FormattedMessage
          id="xpack.agentBuilder.connectors.deleteConnectorConfirmationTextWithResources"
          defaultMessage="This will also delete {workflows} and {tools}. This action cannot be undone."
          values={{
            workflows: (
              <strong>
                <FormattedMessage
                  id="xpack.agentBuilder.connectors.deleteConnectorWorkflowCount"
                  defaultMessage="{count, plural, one {# workflow} other {# workflows}}"
                  values={{ count: workflowsCount }}
                />
              </strong>
            ),
            tools: (
              <strong>
                <FormattedMessage
                  id="xpack.agentBuilder.connectors.deleteConnectorToolCount"
                  defaultMessage="{count, plural, one {# tool} other {# tools}}"
                  values={{ count: toolsCount }}
                />
              </strong>
            ),
          }}
        />
      </p>
    );
  }

  return <p>{labels.connectors.deleteConnectorConfirmationText}</p>;
};

export const ConnectorsProvider = ({ children }: { children: React.ReactNode }) => {
  const {
    services: {
      plugins: { triggersActionsUi },
    },
  } = useKibana();
  const queryClient = useQueryClient();

  // Flyout state
  const createFlyoutState = useFlyoutState();
  const [editingConnector, setEditingConnector] = useState<ActionConnector | null>(null);

  // Track connectors whose lifecycle resources (workflows/tools) are still being created.
  // Every connector is expected to have tools — null counts from the backend mean the
  // lifecycle handler hasn't finished. We poll via refetchInterval on useListConnectors
  // until counts become non-null, or clear pending after a timeout.
  const [pendingConnectorIds, setPendingConnectorIds] = useState<Set<string>>(new Set());

  const isConnectorResourcesPending = useCallback(
    (connectorId: string) => pendingConnectorIds.has(connectorId),
    [pendingConnectorIds]
  );

  // Timeout: clear pending set after RESOURCE_POLLING_TIMEOUT_MS so spinners resolve to 0
  useEffect(() => {
    if (pendingConnectorIds.size === 0) {
      return;
    }
    const timeout = setTimeout(() => {
      setPendingConnectorIds(new Set());
    }, RESOURCE_POLLING_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, [pendingConnectorIds]);

  // Delete hooks
  const {
    isOpen: isDeleteModalOpen,
    isLoading: isDeletingConnector,
    connector: deleteConnectorTarget,
    deleteConnector,
    confirmDelete,
    cancelDelete,
  } = useDeleteConnector();

  const {
    isOpen: isBulkDeleteModalOpen,
    isLoading: isBulkDeletingConnectors,
    connectors: bulkDeleteConnectorTargets,
    bulkDeleteConnectors,
    confirmDelete: confirmBulkDeleteConnectors,
    cancelDelete: cancelBulkDeleteConnectors,
  } = useBulkDeleteConnectors();

  const invalidateConnectors = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.connectors.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.tools.connectors.list() });
  }, [queryClient]);

  // Create flyout
  const handleConnectorCreated = useCallback(
    (connector: ActionConnector) => {
      setPendingConnectorIds((prev) => new Set(prev).add(connector.id));
      invalidateConnectors();
      createFlyoutState.closeFlyout();
    },
    [invalidateConnectors, createFlyoutState]
  );

  const createFlyout = useMemo(
    () =>
      triggersActionsUi.getAddConnectorFlyout({
        onClose: createFlyoutState.closeFlyout,
        onConnectorCreated: handleConnectorCreated,
        featureId: AgentBuilderConnectorFeatureId,
      }),
    [createFlyoutState.closeFlyout, handleConnectorCreated, triggersActionsUi]
  );

  // Edit flyout
  const handleConnectorUpdated = useCallback(() => {
    invalidateConnectors();
    setEditingConnector(null);
  }, [invalidateConnectors]);

  const handleEditClose = useCallback(() => setEditingConnector(null), []);

  const editFlyout = useMemo(() => {
    if (!editingConnector) return null;
    return triggersActionsUi.getEditConnectorFlyout({
      connector: editingConnector,
      onClose: handleEditClose,
      onConnectorUpdated: handleConnectorUpdated,
    });
  }, [editingConnector, handleEditClose, handleConnectorUpdated, triggersActionsUi]);

  const editConnector = useCallback((connector: ConnectorItem) => {
    setEditingConnector(toActionConnector(connector));
  }, []);

  const deleteConnectorTitleId = useGeneratedHtmlId({ prefix: 'deleteConnectorTitle' });
  const bulkDeleteConnectorsTitleId = useGeneratedHtmlId({ prefix: 'bulkDeleteConnectorsTitle' });

  return (
    <ConnectorsActionsContext.Provider
      value={{
        openCreateFlyout: createFlyoutState.openFlyout,
        editConnector,
        deleteConnector,
        bulkDeleteConnectors,
        isConnectorResourcesPending,
      }}
    >
      {children}

      {createFlyoutState.isOpen && createFlyout}
      {editFlyout}

      {isDeleteModalOpen && deleteConnectorTarget && (
        <EuiConfirmModal
          title={labels.connectors.deleteConnectorTitle(deleteConnectorTarget.name)}
          aria-labelledby={deleteConnectorTitleId}
          titleProps={{ id: deleteConnectorTitleId }}
          onCancel={cancelDelete}
          onConfirm={confirmDelete}
          isLoading={isDeletingConnector}
          cancelButtonText={labels.connectors.deleteConnectorCancelButton}
          confirmButtonText={labels.connectors.deleteConnectorConfirmButton}
          buttonColor="danger"
        >
          <EuiText>
            <DeleteConnectorModalBody
              workflowsCount={deleteConnectorTarget.workflowsCount ?? 0}
              toolsCount={deleteConnectorTarget.toolsCount ?? 0}
            />
          </EuiText>
        </EuiConfirmModal>
      )}

      {isBulkDeleteModalOpen && (
        <EuiConfirmModal
          title={labels.connectors.bulkDeleteConnectorsTitle(bulkDeleteConnectorTargets.length)}
          aria-labelledby={bulkDeleteConnectorsTitleId}
          titleProps={{ id: bulkDeleteConnectorsTitleId }}
          onCancel={cancelBulkDeleteConnectors}
          onConfirm={confirmBulkDeleteConnectors}
          isLoading={isBulkDeletingConnectors}
          cancelButtonText={labels.connectors.deleteConnectorCancelButton}
          confirmButtonText={labels.connectors.bulkDeleteConnectorsConfirmButton(
            bulkDeleteConnectorTargets.length
          )}
          buttonColor="danger"
        >
          <EuiText>
            <DeleteConnectorModalBody
              workflowsCount={bulkDeleteConnectorTargets.reduce(
                (sum, c) => sum + (c.workflowsCount ?? 0),
                0
              )}
              toolsCount={bulkDeleteConnectorTargets.reduce(
                (sum, c) => sum + (c.toolsCount ?? 0),
                0
              )}
            />
          </EuiText>
        </EuiConfirmModal>
      )}
    </ConnectorsActionsContext.Provider>
  );
};

export const useConnectorsActions = () => {
  const context = useContext(ConnectorsActionsContext);
  if (!context) {
    throw new Error('useConnectorsActions must be used within a ConnectorsProvider');
  }
  return context;
};
