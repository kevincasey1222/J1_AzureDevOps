import { IntegrationProviderAuthenticationError } from '@jupiterone/integration-sdk-core';

import { ADOIntegrationConfig } from './types';

import * as azdev from 'azure-devops-node-api';
import * as cr from 'azure-devops-node-api/CoreApi';
import { TeamProjectReference, WebApiTeam } from 'azure-devops-node-api/interfaces/CoreInterfaces';
import { TeamMember } from 'azure-devops-node-api/interfaces/common/VSSInterfaces';

export type ResourceIteratee<T> = (each: T) => Promise<void> | void;

type ADOUser = {
  id: string;
}
interface ADOGroup extends WebApiTeam {
  users?: ADOUser[],
}
type ADOWorkitem = {
  id: string;
  name: string;
};

// Those can be useful to a degree, but often they're just full of optional
// values. Understanding the response data may be more reliably accomplished by
// reviewing the API response recordings produced by testing the wrapper client
// (below). However, when there are no types provided, it is necessary to define
// opaque types for each resource, to communicate the records that are expected
// to come from an endpoint and are provided to iterating functions.

/*
import { Opaque } from 'type-fest';
export type AcmeUser = Opaque<any, 'AcmeUser'>;
export type AcmeGroup = Opaque<any, 'AcmeGroup'>;
*/

/**
 * An APIClient maintains authentication state and provides an interface to
 * third party data APIs.
 *
 * It is recommended that integrations wrap provider data APIs to provide a
 * place to handle error responses and implement common patterns for iterating
 * resources.
 */
export class APIClient {
  constructor(readonly config: ADOIntegrationConfig) {}

  public async verifyAuthentication(): Promise<void> {
    // the most light-weight request possible to validate
    // authentication works with the provided credentials, throw an err if
    // authentication fails

    try {
      const authHandler = azdev.getPersonalAccessTokenHandler(
        this.config.accessToken,
      );
      const connection = new azdev.WebApi(this.config.orgUrl, authHandler);
      await connection.getCoreApi(); //the authen will fail on this line is accessToken is bad
    } catch (err) {
      throw new IntegrationProviderAuthenticationError({
        cause: err,
        endpoint: 'ADO API', //'https://localhost/api/v1/some/endpoint?limit=1',
        status: err.status,
        statusText: err.statusText,
      });
    }
  }

  /**
   * Iterates each user resource in the provider.
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iterateProjects(
    iteratee: ResourceIteratee<TeamProjectReference>,
  ): Promise<void> {

    let projects: TeamProjectReference[] = [];

    try {
      const authHandler = azdev.getPersonalAccessTokenHandler(
        this.config.accessToken,
      );
      const connection = new azdev.WebApi(this.config.orgUrl, authHandler);
      const core: cr.ICoreApi = await connection.getCoreApi();
      projects = await core.getProjects();
    } catch (err) {
      throw new IntegrationProviderAuthenticationError({
        cause: err,
        endpoint: 'ADO API', //'https://localhost/api/v1/some/endpoint?limit=1',
        status: err.status,
        statusText: err.statusText,
      });
    }

    for (const proj of projects) {
      await iteratee(proj);
    }
  }

  /**
   * Iterates each user resource in the provider.
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iterateUsers(
    iteratee: ResourceIteratee<TeamMember>,
  ): Promise<void> {

    let users: TeamMember[] = [];

    try {
      const authHandler = azdev.getPersonalAccessTokenHandler(
        this.config.accessToken,
      );
      const connection = new azdev.WebApi(this.config.orgUrl, authHandler);
      const core: cr.ICoreApi = await connection.getCoreApi();
      const allTeams = await core.getAllTeams();
      for (const team of allTeams) {
        if ((team.projectId != undefined) && (team.id != undefined)) {
          const teamMembers = await core.getTeamMembersWithExtendedProperties(team.projectId, team.id);
          for (const teamMember of teamMembers) { 
            if (!(users.map(x => x.identity?.id).includes(teamMember.identity?.id))) {
              users.push(teamMember);
            }
          }
        }
      }
    } catch (err) {
      throw new IntegrationProviderAuthenticationError({
        cause: err,
        endpoint: 'ADO API', //'https://localhost/api/v1/some/endpoint?limit=1',
        status: err.status,
        statusText: err.statusText,
      });
    }

    for (const user of users) {
      await iteratee(user);
    }
  }

  /**
   * Iterates each group resource in the provider.
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iterateGroups(
    iteratee: ResourceIteratee<ADOGroup>,
  ): Promise<void> {

    let groups: ADOGroup[] = [];

    try {
      const authHandler = azdev.getPersonalAccessTokenHandler(
        this.config.accessToken,
      );
      const connection = new azdev.WebApi(this.config.orgUrl, authHandler);
      const core: cr.ICoreApi = await connection.getCoreApi();
      const allTeams = await core.getAllTeams();
      for (const team of allTeams) {
        if ((team.projectId != undefined) && (team.id != undefined)) {
          const group: ADOGroup = team;
          group.users = [];
          const teamMembers = await core.getTeamMembersWithExtendedProperties(team.projectId, team.id);
          for (const teamMember of teamMembers) { 
            if (teamMember.identity?.id != undefined) {
              const userId = { id: teamMember.identity?.id } ;
              group.users.push(userId);
            }
          }
        }
      }
    } catch (err) {
      throw new IntegrationProviderAuthenticationError({
        cause: err,
        endpoint: 'ADO API', //'https://localhost/api/v1/some/endpoint?limit=1',
        status: err.status,
        statusText: err.statusText,
      });
    }
    
     /* {
        id: 'acme-group-1',
        name: 'Group One',
        users: [
          {
            id: 'acme-user-1',
          },
        ],
      },
    ];*/

    for (const group of groups) {
      await iteratee(group);
    }
  }

  public async iterateWorkitems(
    iteratee: ResourceIteratee<ADOWorkitem>,
  ): Promise<void> {
    // TODO paginate an endpoint, invoke the iteratee with each record in the
    // page
    //
    // The provider API will hopefully support pagination. Functions like this
    // should maintain pagination state, and for each page, for each record in
    // the page, invoke the `ResourceIteratee`. This will encourage a pattern
    // where each resource is processed and dropped from memory.
    const items: ADOWorkitem[] = [];

    try {
      const authHandler = azdev.getPersonalAccessTokenHandler(
        this.config.accessToken,
      );
      const connection = new azdev.WebApi(this.config.orgUrl, authHandler);
      const core: cr.ICoreApi = await connection.getCoreApi();
      const projectsJSON = core.getProjects();
      console.log(projectsJSON);
      //now load up projects array with ADOProject objects based on the JSON
    } catch (err) {
      throw new IntegrationProviderAuthenticationError({
        cause: err,
        endpoint: 'ADO API', //'https://localhost/api/v1/some/endpoint?limit=1',
        status: err.status,
        statusText: err.statusText,
      });
    }

    for (const item of items) {
      await iteratee(item);
    }
  }
}

export function createAPIClient(config: ADOIntegrationConfig): APIClient {
  return new APIClient(config);
}
