import { accountSteps } from './account';
import { projectSteps } from './projects';
import { userSteps } from './users';
import { groupSteps } from './users';
import { workitemSteps } from './workitems';

const integrationSteps = [
    ...accountSteps, 
    ...projectSteps,
    ...userSteps,
    ...groupSteps,
    ...workitemSteps
];

export { integrationSteps };
