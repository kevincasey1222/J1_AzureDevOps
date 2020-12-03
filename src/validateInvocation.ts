import {
  IntegrationExecutionContext,
  IntegrationValidationError,
} from '@jupiterone/integration-sdk-core';

import { createAPIClient } from './client';
import { IntegrationConfig } from './types';

import { URL } from 'url';

export default async function validateInvocation(
  context: IntegrationExecutionContext<IntegrationConfig>,
) {
  const { config } = context.instance;

  if (!config.orgUrl || !config.accessToken) {
    throw new IntegrationValidationError(
      'Config requires all of {orgUrl, accessToken}',
    );
  }

  try {
    new URL(config.orgUrl);
  } catch (err) {
    throw new IntegrationValidationError(
      'Invalid API URL: ' + config.orgUrl
    );
  }


  const apiClient = createAPIClient(config);
  await apiClient.verifyAuthentication();
}
