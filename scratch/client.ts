
//import { IntegrationProviderAuthenticationError } from '@jupiterone/integration-sdk-core';

//import { IntegrationConfig } from '../src/types';

import * as azdev from 'azure-devops-node-api';
import * as cr from 'azure-devops-node-api/CoreApi';

export type ResourceIteratee<T> = (each: T) => Promise<void> | void;

// Providers often supply types with their API libraries.

type AcmeUser = {
  id: string;
  name: string;
};

type AcmeGroup = {
  id: string;
  name: string;
  users?: Pick<AcmeUser, 'id'>[];
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
  constructor(readonly config) {}

  public async verifyAuthentication(): Promise<void> {
    // TODO make the most light-weight request possible to validate
    // authentication works with the provided credentials, throw an err if
    // authentication fails

    try {
      const authHandler = azdev.getPersonalAccessTokenHandler(
        String(this.config.accessToken),
      );
      const neededURL: string = String(this.config.orgUrl);
      console.log('Got here step 1');
      const connection = new azdev.WebApi(neededURL, authHandler);
      console.log('Got here step 2');
      console.log(await connection.connect());
      console.log('Got here step 2.2');
      const whynot = await connection.getBuildApi();
      console.log(whynot.baseUrl);
      console.log('Got here step 2.5');
      const core: cr.ICoreApi = await connection.getCoreApi();
      console.log('Got here step 3');
      const stuff = await core.getProjects();
      console.log('Got here step 4');
      console.log(stuff);
    } catch (err) {
      console.log(err);
      /*
      throw new IntegrationProviderAuthenticationError({
        cause: err,
        endpoint: 'ADO API', //'https://localhost/api/v1/some/endpoint?limit=1',
        status: err.status,
        statusText: err.statusText,
      });
      */
    }
  }

    /**
   * Iterates each user resource in the provider.
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iterateUsers(
    iteratee: ResourceIteratee<AcmeUser>,
  ): Promise<void> {
    // TODO paginate an endpoint, invoke the iteratee with each record in the
    // page
    //
    // The provider API will hopefully support pagination. Functions like this
    // should maintain pagination state, and for each page, for each record in
    // the page, invoke the `ResourceIteratee`. This will encourage a pattern
    // where each resource is processed and dropped from memory.
    try {
      const authHandler = azdev.getPersonalAccessTokenHandler(
        this.config.accessToken,
      );
      const connection = new azdev.WebApi(this.config.orgUrl, authHandler);
      const core: cr.ICoreApi = await connection.getCoreApi();
      const stuff = core.getTeams('Initial Project'); //todo add params here
      console.log(stuff);
    } catch (err) {
      console.log(err);
      /*
      throw new IntegrationProviderAuthenticationError({
        cause: err,
        endpoint: 'ADO API', //'https://localhost/api/v1/some/endpoint?limit=1',
        status: err.status,
        statusText: err.statusText,
      });
      */
    }
    
    const users: AcmeUser[] = [
      {
        id: 'acme-user-1',
        name: 'User One',
      },
      {
        id: 'acme-user-2',
        name: 'User Two',
      },
    ];

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
    iteratee: ResourceIteratee<AcmeGroup>,
  ): Promise<void> {
    // TODO paginate an endpoint, invoke the iteratee with each record in the
    // page
    //
    // The provider API will hopefully support pagination. Functions like this
    // should maintain pagination state, and for each page, for each record in
    // the page, invoke the `ResourceIteratee`. This will encourage a pattern
    // where each resource is processed and dropped from memory.

    const groups: AcmeGroup[] = [
      {
        id: 'acme-group-1',
        name: 'Group One',
        users: [
          {
            id: 'acme-user-1',
          },
        ],
      },
    ];

    for (const group of groups) {
      await iteratee(group);
    }
  }
}

export function createAPIClient(config): APIClient {
  return new APIClient(config);
}
