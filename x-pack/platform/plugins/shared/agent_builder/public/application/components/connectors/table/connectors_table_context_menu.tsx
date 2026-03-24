/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { EuiButtonIcon, EuiContextMenuItem, EuiContextMenuPanel, EuiPopover } from '@elastic/eui';
import React, { useState } from 'react';
import type { ConnectorItem } from '../../../../../common/http_api/tools';
import { useConnectorsActions } from '../../../context/connectors_provider';
import { useKibana } from '../../../hooks/use_kibana';
import { labels } from '../../../utils/i18n';

export interface ConnectorContextMenuProps {
  connector: ConnectorItem;
}

export const ConnectorContextMenu = ({ connector }: ConnectorContextMenuProps) => {
  const { editConnector, deleteConnector } = useConnectorsActions();
  const [isOpen, setIsOpen] = useState(false);
  const {
    services: { application },
  } = useKibana();
  const canDelete = application.capabilities.actions?.delete === true;

  const editMenuItem = (
    <EuiContextMenuItem
      icon="pencil"
      key="edit"
      size="s"
      onClick={() => {
        editConnector(connector);
        setIsOpen(false);
      }}
    >
      {labels.connectors.editConnectorButtonLabel}
    </EuiContextMenuItem>
  );

  const deleteMenuItem = (
    <EuiContextMenuItem
      icon="trash"
      key="delete"
      size="s"
      css={({ euiTheme }) => ({
        color: euiTheme.colors.textDanger,
      })}
      onClick={() => {
        deleteConnector(connector);
        setIsOpen(false);
      }}
    >
      {labels.connectors.deleteConnectorButtonLabel}
    </EuiContextMenuItem>
  );

  const menuItems = canDelete ? [editMenuItem, deleteMenuItem] : [editMenuItem];

  return (
    <EuiPopover
      id={`${connector.id}_context-menu`}
      panelPaddingSize="s"
      button={
        <EuiButtonIcon
          iconType="boxesVertical"
          onClick={() => setIsOpen((openState) => !openState)}
          aria-label={labels.connectors.connectorContextMenuButtonLabel}
        />
      }
      isOpen={isOpen}
      closePopover={() => setIsOpen(false)}
    >
      <EuiContextMenuPanel size="s" items={menuItems} />
    </EuiPopover>
  );
};
