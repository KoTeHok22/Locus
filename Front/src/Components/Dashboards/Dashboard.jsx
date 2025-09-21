import { ConstructionDashboard } from './ConstructionDashboard';

function Dashboard({onSwitchToLogin, onSwitchToPage}) {
    return (
        <ConstructionDashboard onSwitchToLogin={onSwitchToLogin} />
    );
}

export { Dashboard };