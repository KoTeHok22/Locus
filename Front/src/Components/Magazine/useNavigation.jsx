import { useState } from 'react';

function useNavigation() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <DashboardContent />;
            case 'objectList':
                return <ObjectListContent />;
            case 'map':
                return <MapContent />;
            case 'analytics':
                return <AnalyticsContent />;
            case 'settings':
                return <SettingsContent />;
            default:
                return <DashboardContent />;
        }
    };

    return {
        activeTab,
        setActiveTab,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        renderContent
    };
}

export { useNavigation }