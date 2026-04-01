/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { EuiButtonIcon, EuiConfirmModal, EuiFlexGroup, useGeneratedHtmlId } from '@elastic/eui';
import { css } from '@emotion/react';
import {
  useConnectorOAuthConnect,
  OAuthRedirectMode,
  useConnectorOAuthDisconnect,
} from '@kbn/response-ops-oauth-hooks';
import { usesOAuthAuthorizationCode } from '@kbn/triggers-actions-ui-plugin/public';
import React, { useState } from 'react';
import type { ConnectorItem } from '../../../../../common/http_api/tools';
import { useConnectorsActions, toActionConnector } from '../../../context/connectors_provider';
import { useKibana } from '../../../hooks/use_kibana';
import { labels } from '../../../utils/i18n';

export interface ConnectorQuickActionsProps {
  connector: ConnectorItem;
}

export const connectorQuickActionsHoverStyles = css`
  .euiTableRow:hover .connector-quick-actions {
    visibility: visible;
  }
`;

/**
 * OAuth quick action buttons.
 */
const OAuthQuickActions: React.FC<{
  connector: ConnectorItem;
}> = ({ connector }) => {
  const {
    services: {
      notifications: { toasts },
    },
  } = useKibana();
  const { invalidateConnectors } = useConnectorsActions();
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const disconnectModalTitleId = useGeneratedHtmlId({ prefix: 'disconnectQuickAction' });

  const { connect, isAwaitingCallback } = useConnectorOAuthConnect({
    connectorId: connector.id,
    redirectMode: OAuthRedirectMode.NewTab,
    onSuccess: () => {
      toasts.addSuccess({
        title: labels.connectors.oauthConnectSuccessTitle,
        text: labels.connectors.oauthConnectSuccessMessage,
      });
      invalidateConnectors();
    },
    onError: (error) => {
      toasts.addDanger({
        title: labels.connectors.oauthConnectErrorTitle,
        text: error.message,
      });
    },
  });

  const { disconnect, isDisconnecting } = useConnectorOAuthDisconnect({
    connectorId: connector.id,
    onSuccess: () => {
      toasts.addSuccess({
        title: labels.connectors.oauthDisconnectSuccessTitle,
        text: labels.connectors.oauthDisconnectSuccessMessage,
      });
      invalidateConnectors();
      setShowDisconnectConfirm(false);
    },
    onError: (error) => {
      toasts.addDanger({
        title: labels.connectors.oauthDisconnectErrorTitle,
        text: error.message,
      });
      setShowDisconnectConfirm(false);
    },
  });

  return (
    <>
      <EuiButtonIcon
        data-test-subj="agentBuilderConnectorsRowAuthorizeButton"
        iconType="link"
        disabled={isDisconnecting || isAwaitingCallback}
        onClick={() => connect()}
        aria-label={labels.connectors.authorizeButtonLabel}
      />
      <EuiButtonIcon
        data-test-subj="agentBuilderConnectorsRowDisconnectButton"
        iconType="linkSlash"
        disabled={isAwaitingCallback}
        onClick={() => setShowDisconnectConfirm(true)}
        aria-label={labels.connectors.disconnectButtonLabel}
      />
      {showDisconnectConfirm && (
        <EuiConfirmModal
          aria-labelledby={disconnectModalTitleId}
          titleProps={{ id: disconnectModalTitleId }}
          title={labels.connectors.disconnectConfirmTitle(connector.name)}
          onCancel={() => setShowDisconnectConfirm(false)}
          onConfirm={disconnect}
          cancelButtonText={labels.connectors.disconnectCancelButton}
          confirmButtonText={labels.connectors.disconnectConfirmButton}
          buttonColor="danger"
          isLoading={isDisconnecting}
        >
          {labels.connectors.disconnectConfirmMessage}
        </EuiConfirmModal>
      )}
    </>
  );
};

export const ConnectorQuickActions = ({ connector }: ConnectorQuickActionsProps) => {
  const { deleteConnector } = useConnectorsActions();
  const isOAuth = usesOAuthAuthorizationCode(toActionConnector(connector));

  return (
    <EuiFlexGroup
      css={css`
        visibility: hidden;
      `}
      className="connector-quick-actions"
      gutterSize="s"
      justifyContent="flexEnd"
      alignItems="center"
      component="span"
    >
      {isOAuth && <OAuthQuickActions connector={connector} />}
      <EuiButtonIcon
        data-test-subj="agentBuilderConnectorsRowDeleteButton"
        iconType="trash"
        color="danger"
        onClick={() => deleteConnector(connector)}
        aria-label={labels.connectors.deleteConnectorButtonLabel}
      />
    </EuiFlexGroup>
  );
};
