import {
  //IntegrationExecutionContext,
  IntegrationValidationError,
} from '@jupiterone/integration-sdk-core';

import { createAPIClient } from './client';
//import { IntegrationConfig } from '../src/types';

import { URL } from 'url';

export default async function validateInvocation() {
  const orgURL: string = 'https://dev.azure.com/tkcasey1';
  //const accessToken: string = 'ru4i6eporze33ljiuoxig6q2z2zu5ohhswlrj7yuvfp5e3qwwy4q';
  const accessToken: string = 'adgjbbgy4fwewzemgsc45t2heyh5wlcncluo7qcdp2nuc6gif22q';
  const config  = {
    orgURL: orgURL,
    accessToken: accessToken,
  };

  if (!config.orgURL || !config.accessToken) {
    throw new IntegrationValidationError(
      'Config requires all of {orgUrl, accessToken}',
    );
  }

  try {
    new URL(config.orgURL);
  } catch (err) {
    throw new IntegrationValidationError(
      'Invalid API URL: ' + config.orgURL
    );
  }


  const apiClient = createAPIClient(config);
  await apiClient.verifyAuthentication();
}
