/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { CriteriaWithPagination } from '@elastic/eui';
import { EuiInMemoryTable, EuiSkeletonText, EuiText } from '@elastic/eui';
import React, { memo, useCallback, useState } from 'react';
import type { ConnectorItem, ListConnectorsResponse } from '../../../../../common/http_api/tools';
import { useConnectorsActions } from '../../../context/connectors_provider';
import { useListConnectors } from '../../../hooks/tools/use_mcp_connectors';
import { labels } from '../../../utils/i18n';
import { useConnectorsTableColumns } from './connectors_table_columns';
import { ConnectorsTableHeader } from './connectors_table_header';
import { connectorQuickActionsHoverStyles } from './connectors_table_quick_actions';
import { useConnectorsTableSearch } from './connectors_table_search';

const RESOURCE_POLL_INTERVAL_MS = 3000;

export const AgentBuilderConnectorsTable = memo(() => {
  const { isConnectorResourcesPending } = useConnectorsActions();

  // Poll while any pending connector still has null toolsCount (lifecycle handler running).
  const refetchInterval = useCallback(
    (data: ListConnectorsResponse | undefined) => {
      if (!data) return false;
      const hasPendingNullCounts = data.connectors.some(
        (c) => c.toolsCount === null && isConnectorResourcesPending(c.id)
      );
      return hasPendingNullCounts ? RESOURCE_POLL_INTERVAL_MS : false;
    },
    [isConnectorResourcesPending]
  );

  const { connectors, isLoading, error } = useListConnectors({ refetchInterval });
  const [tablePageIndex, setTablePageIndex] = useState(0);
  const [tablePageSize, setTablePageSize] = useState(10);
  const [selectedConnectors, setSelectedConnectors] = useState<ConnectorItem[]>([]);
  const columns = useConnectorsTableColumns();
  const searchConfig = useConnectorsTableSearch();

  return (
    <EuiInMemoryTable
      tableCaption={labels.connectors.tableCaption(connectors.length)}
      data-test-subj="agentBuilderConnectorsTable"
      css={[
        ({ euiTheme }) => ({
          borderTop: `1px solid ${euiTheme.colors.borderBaseSubdued}`,
          '& table': {
            backgroundColor: 'transparent',
          },
        }),
        connectorQuickActionsHoverStyles,
      ]}
      childrenBetween={
        <ConnectorsTableHeader
          isLoading={isLoading}
          pageIndex={tablePageIndex}
          pageSize={tablePageSize}
          connectors={connectors as ConnectorItem[]}
          total={connectors.length}
          selectedConnectors={selectedConnectors}
          setSelectedConnectors={setSelectedConnectors}
        />
      }
      loading={isLoading}
      columns={columns}
      items={connectors as ConnectorItem[]}
      itemId="id"
      error={error ? labels.connectors.listConnectorsErrorMessage : undefined}
      search={searchConfig}
      onTableChange={({ page }: CriteriaWithPagination<ConnectorItem>) => {
        if (page) {
          setTablePageIndex(page.index);
          if (page.size !== tablePageSize) {
            setTablePageSize(page.size);
            setTablePageIndex(0);
          }
        }
      }}
      pagination={{
        pageIndex: tablePageIndex,
        pageSize: tablePageSize,
        pageSizeOptions: [10, 25, 50, 100],
        showPerPageOptions: true,
      }}
      rowProps={(connector) => ({
        'data-test-subj': `agentBuilderConnectorsTableRow-${connector.id}`,
      })}
      selection={{
        selectable: (connector) => !connector.isPreconfigured,
        onSelectionChange: (selectedItems: ConnectorItem[]) => {
          setSelectedConnectors(selectedItems);
        },
        selected: selectedConnectors,
      }}
      noItemsMessage={
        isLoading ? (
          <EuiSkeletonText lines={1} />
        ) : (
          <EuiText component="p" size="s" textAlign="center" color="subdued">
            {labels.connectors.noConnectorsMessage}
          </EuiText>
        )
      }
    />
  );
});
