import {
  createDirectRelationship,
  createIntegrationEntity,
  Entity,
  IntegrationStep,
  IntegrationStepExecutionContext,
  RelationshipClass,
  IntegrationMissingKeyError,
} from '@jupiterone/integration-sdk-core';
//import { ResultGroupType } from 'azure-devops-node-api/interfaces/TestInterfaces';

import { createAPIClient } from '../../client';
import { ADOIntegrationConfig } from '../../types';
import { AZURE_DEVOPS_ACCOUNT } from '../account';

export async function fetchUsers({
  instance,
  jobState,
}: IntegrationStepExecutionContext<ADOIntegrationConfig>) {
  const apiClient = createAPIClient(instance.config);

  const accountEntity = (await jobState.getData(
    AZURE_DEVOPS_ACCOUNT,
  )) as Entity;

  await apiClient.iterateUsers(async (user) => {
    const userEntity = await jobState.addEntity(
      createIntegrationEntity({
        entityData: {
          source: user,
          assign: {
            _type: 'azure_devops_user',
            _class: 'User',
            _key: user.identity?.id,
            name: user.identity?.displayName,
            displayName: user.identity?.displayName,
            email: user.identity?.uniqueName,
            username: user.identity?.uniqueName,
            webLink: user.identity?.url,
            imageLink: user.identity?.imageUrl,
            descriptor: user.identity?.descriptor,
            profileLink: user.identity?.profileUrl
          },
        },
      }),
    );

    await jobState.addRelationship(
      createDirectRelationship({
        _class: RelationshipClass.HAS,
        from: accountEntity,
        to: userEntity,
      }),
    );
  });
}

export async function fetchGroups({
  instance,
  jobState,
}: IntegrationStepExecutionContext<ADOIntegrationConfig>) {
  const apiClient = createAPIClient(instance.config);

  const accountEntity = (await jobState.getData(
    AZURE_DEVOPS_ACCOUNT,
  )) as Entity;

  await apiClient.iterateGroups(async (group) => {
    const groupEntity = await jobState.addEntity(
      createIntegrationEntity({
        entityData: {
          source: group,
          assign: {
            _type: 'azure_devops_team',
            _class: 'UserGroup',
            _key: group.id,
            name: group.name,
            displayName: group.name,
            webLink: group.url,
            description: group.description,
            identityUrl: group.identityUrl,
            projectName: group.projectName,
            projectId: group.projectId,
          },
        },
      }),
    );

    await jobState.addRelationship(
      createDirectRelationship({
        _class: RelationshipClass.HAS,
        from: accountEntity,
        to: groupEntity,
      }),
    );

    for (const user of group.users || []) {
      const userEntity = await jobState.findEntity(user.id);

      if (!userEntity) {
        throw new IntegrationMissingKeyError(
          `Expected user with key to exist (key=${user.id})`,
        );
      }

      await jobState.addRelationship(
        createDirectRelationship({
          _class: RelationshipClass.HAS,
          from: groupEntity,
          to: userEntity,
        }),
      );
    }

    if (group.projectId != undefined) {
      const projectEntity = await jobState.findEntity(group.projectId);
      if (!projectEntity) {
        throw new IntegrationMissingKeyError(
          `Expected project with key to exist (key=${group.projectId})`,
        );
      }
      await jobState.addRelationship(
        createDirectRelationship({
          _class: RelationshipClass.HAS,
          from: projectEntity,
          to: groupEntity,
        }),
      );
    }
    
  });
}

export const userSteps: IntegrationStep<ADOIntegrationConfig>[] = [
  {
    id: 'fetch-users',
    name: 'Fetch Users',
    entities: [
      {
        resourceName: 'ADO User',
        _type: 'azure_devops_user',
        _class: 'User',
      },
    ],
    relationships: [
      {
        _type: 'azure_devops_account_has_user',
        _class: RelationshipClass.HAS,
        sourceType: 'azure_devops_account',
        targetType: 'azure_devops_user',
      },
      {
        _type: 'azure_devops_project_has_team',
        _class: RelationshipClass.HAS,
        sourceType: 'azure_devops_project',
        targetType: 'azure_devops_team',
      },
      {
        _type: 'azure_devops_account_has_team',
        _class: RelationshipClass.HAS,
        sourceType: 'azure_devops_account',
        targetType: 'azure_devops_team',
      },
      {
        _type: 'azure_devops_team_has_user',
        _class: RelationshipClass.HAS,
        sourceType: 'azure_devops_team',
        targetType: 'azure_devops_user',
      },
    ],
    dependsOn: ['fetch-projects'],
    executionHandler: fetchUsers,
  },
];

export const groupSteps: IntegrationStep<ADOIntegrationConfig>[] = [
  {
    id: 'fetch-groups',
    name: 'Fetch Groups',
    entities: [
      {
        resourceName: 'ADO Team',
        _type: 'azure_devops_team',
        _class: 'UserGroup',
      },
    ],
    relationships: [
      {
        _type: 'azure_devops_project_has_team',
        _class: RelationshipClass.HAS,
        sourceType: 'azure_devops_project',
        targetType: 'azure_devops_team',
      },
      {
        _type: 'azure_devops_account_has_team',
        _class: RelationshipClass.HAS,
        sourceType: 'azure_devops_account',
        targetType: 'azure_devops_team',
      },
      {
        _type: 'azure_devops_team_has_user',
        _class: RelationshipClass.HAS,
        sourceType: 'azure_devops_team',
        targetType: 'azure_devops_user',
      },
    ],
    dependsOn: ['fetch-users'],
    executionHandler: fetchGroups,
  },
];
