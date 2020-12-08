import { accountSteps } from './account';
import { projectSteps } from './projects';
import { userSteps } from './users';
import { workitemSteps } from './workitems';

const integrationSteps = [
    ...accountSteps, 
    ...projectSteps,
    ...userSteps,
    ...workitemSteps
];

export { integrationSteps };
