import { IntegrationInvocationConfig } from '@jupiterone/integration-sdk-core';

import instanceConfigFields from './instanceConfigFields';
import { accountSteps } from './steps/account';
import { projectSteps } from './steps/projects';
import { userSteps } from './steps/users';
import { workitemSteps } from './steps/workitems';
import { IntegrationConfig } from './types';
import validateInvocation from './validateInvocation';

export const invocationConfig: IntegrationInvocationConfig<IntegrationConfig> = {
  instanceConfigFields,
  validateInvocation,
  integrationSteps: [
    ...accountSteps, 
    ...projectSteps,
    ...userSteps,
    ...workitemSteps
  ],
};
