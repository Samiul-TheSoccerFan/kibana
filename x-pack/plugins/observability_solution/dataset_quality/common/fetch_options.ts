/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { HttpFetchOptions } from '@kbn/core/public';

export type FetchOptions = Omit<HttpFetchOptions, 'body'> & {
  pathname: string;
  method?: string;
  body?: any;
};

export interface ApiErrorResponse {
  body: {
    statusCode: number;
    error: string;
    message: string;
    attributes: object;
  };
}
