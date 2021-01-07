import { createMockStepExecutionContext } from '@jupiterone/integration-sdk-testing';

import { ADOIntegrationConfig } from '../types';
import { fetchProjects } from './projects';
import { fetchWorkitems } from './workitems';
import { fetchTeams } from './teams';
import { fetchUsers } from './users';
import { fetchAccountDetails } from './account';

const DEFAULT_ORG_URL = 'https://dev.azure.com/tkcasey1';
const DEFAULT_ACCESS_TOKEN =
  'vfpvjk6lggyfu5bcglvenyhfllyitn2toalf33srqdhmgnqdykra';

const integrationConfig: ADOIntegrationConfig = {
  orgUrl: process.env.ORG_URL || DEFAULT_ORG_URL,
  accessToken: process.env.ACCESS_TOKEN || DEFAULT_ACCESS_TOKEN,
};

jest.setTimeout(25000);

test('should collect data', async () => {
  const context = createMockStepExecutionContext<ADOIntegrationConfig>({
    instanceConfig: integrationConfig,
  });

  // Simulates dependency graph execution.
  // See https://github.com/JupiterOne/sdk/issues/262.
  await fetchAccountDetails(context);
  await fetchProjects(context);
  await fetchWorkitems(context);
  await fetchUsers(context);
  await fetchTeams(context);

  console.log(context.jobState.collectedEntities.length);
  console.log(context.jobState.collectedRelationships.length);
  console.log(context.jobState.collectedEntities);
  console.log(context.jobState.collectedRelationships);
  console.log(context.jobState.encounteredTypes);

  // Review snapshot, failure is a regression
  expect({
    numCollectedEntities: context.jobState.collectedEntities.length,
    numCollectedRelationships: context.jobState.collectedRelationships.length,
    collectedEntities: context.jobState.collectedEntities,
    collectedRelationships: context.jobState.collectedRelationships,
    encounteredTypes: context.jobState.encounteredTypes,
  }).toMatchSnapshot();

  const accounts = context.jobState.collectedEntities.filter((e) =>
    e._class.includes('Account'),
  );
  expect(accounts.length).toBeGreaterThan(0);
  expect(accounts).toMatchGraphObjectSchema({
    _class: ['Account'],
    schema: {
      additionalProperties: false,
      properties: {
        _type: { const: 'azure_devops_account' },
        _key: { type: 'string' },
        name: { type: 'string' },
        displayName: { type: 'string' },
      },
      required: ['name'],
    },
  });

  /*
  const users = context.jobState.collectedEntities.filter((e) =>
    e._class.includes('User'),
  );
  expect(users.length).toBeGreaterThan(0);
  expect(users).toMatchGraphObjectSchema({
    _class: ['User'],
    schema: {
      additionalProperties: false,
      properties: {
        _type: { const: 'acme_user' },
        firstName: { type: 'string' },
        _rawData: {
          type: 'array',
          items: { type: 'object' },
        },
      },
      required: ['firstName'],
    },
  });

  const userGroups = context.jobState.collectedEntities.filter((e) =>
    e._class.includes('UserGroup'),
  );
  expect(userGroups.length).toBeGreaterThan(0);
  expect(userGroups).toMatchGraphObjectSchema({
    _class: ['UserGroup'],
    schema: {
      additionalProperties: false,
      properties: {
        _type: { const: 'acme_group' },
        logoLink: {
          type: 'string',
          // Validate that the `logoLink` property has a URL format
          format: 'url',
        },
        _rawData: {
          type: 'array',
          items: { type: 'object' },
        },
      },
      required: ['logoLink'],
    },
  }); */
});
