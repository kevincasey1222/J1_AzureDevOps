import {
  createDirectRelationship,
  createIntegrationEntity,
  Entity,
  IntegrationStep,
  IntegrationStepExecutionContext,
  RelationshipClass,
  //IntegrationMissingKeyError,
} from '@jupiterone/integration-sdk-core';

import { createAPIClient } from '../../client';
import { ADOIntegrationConfig } from '../../types';
import { AZURE_DEVOPS_ACCOUNT } from '../account';

export async function fetchProjects({
  instance,
  jobState,
}: IntegrationStepExecutionContext<ADOIntegrationConfig>) {
  const apiClient = createAPIClient(instance.config);

  const accountEntity = (await jobState.getData(
    AZURE_DEVOPS_ACCOUNT,
  )) as Entity;

  await apiClient.iterateProjects(async (project) => {
    const projectEntity = await jobState.addEntity(
      createIntegrationEntity({
        entityData: {
          source: project,
          assign: {
            _type: 'azure_devops_project',
            _class: 'Project',
            projectname: project.name,
            // email: 'test@test.com',
            // This is a custom property that is not a part of the data model class
            // hierarchy. See: https://github.com/JupiterOne/data-model/blob/master/src/schemas/User.json
            //firstName: 'John',
          },
        },
      }),
    );

    await jobState.addRelationship(
      createDirectRelationship({
        _class: RelationshipClass.HAS,
        from: accountEntity,
        to: projectEntity,
      }),
    );
  });
}

export const projectSteps: IntegrationStep<ADOIntegrationConfig>[] = [
  {
    id: 'fetch-projects',
    name: 'Fetch Projects',
    entities: [
      {
        resourceName: 'ADO Account',
        _type: 'azure_devops_account',
        _class: 'Account',
      },
    ],
    relationships: [
      {
        _type: 'azure_devops_account_has_project',
        _class: RelationshipClass.HAS,
        sourceType: 'azure_devops_account',
        targetType: 'azure_devops_project',
      },
    ],
    dependsOn: [],
    executionHandler: fetchProjects,
  },
];
