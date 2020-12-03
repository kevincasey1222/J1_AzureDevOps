import {
  createIntegrationEntity,
  IntegrationStep,
  IntegrationStepExecutionContext,
} from '@jupiterone/integration-sdk-core';

import { IntegrationConfig } from '../types';

export const AZURE_DEVOPS_ACCOUNT = 'azure_devops_account';

export async function fetchAccountDetails({
  instance,
  jobState,
}: IntegrationStepExecutionContext<IntegrationConfig>) {
  const name = `Azure Devops - ${instance.name}`;
  const accountEntity = await jobState.addEntity(
    createIntegrationEntity({
      entityData: {
        source: {
          id: 'azure-devops',
          name: 'Azure Devops Account',
        },
        assign: {
          _key: `azure-devops-account:${instance.id}`,
          _type: 'azure_devops_account',
          _class: 'Account',
          name,
          displayName: name
        },
      },
    }),
  );

  await jobState.setData(AZURE_DEVOPS_ACCOUNT, accountEntity);
}

export const accountSteps: IntegrationStep<IntegrationConfig>[] = [
  {
    id: 'azure-devops',
    name: 'Azure Devops Account Details',
    entities: [
      {
        resourceName: 'Azure Devops Account',
        _type: AZURE_DEVOPS_ACCOUNT,
        _class: 'Account',
      },
    ],
    relationships: [],
    dependsOn: [],
    executionHandler: fetchAccountDetails,
  },
];
