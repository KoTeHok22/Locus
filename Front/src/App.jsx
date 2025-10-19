import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import AuthService from './authService';
import { MainLayout } from './Components/MainLayout';

const ProjectsPage = lazy(() => import('./Pages/ProjectsPage').then(module => ({ default: module.ProjectsPage })));
const MapPage = lazy(() => import('./Pages/MapPage').then(module => ({ default: module.MapPage })));
const ProjectDetailsPage = lazy(() => import('./Pages/ProjectDetailsPage').then(module => ({ default: module.ProjectDetailsPage })));
const ReportsPage = lazy(() => import('./Pages/ReportsPage').then(module => ({ default: module.ReportsPage })));
const LoginForm = lazy(() => import('./Components/LoginForm/LoginForm').then(module => ({ default: module.LoginForm })));
const RegistrationForm = lazy(() => import('./Components/RegistrationForm/RegistrationForm').then(module => ({ default: module.RegistrationForm })));
const ManagerDHB = lazy(() => import('./Components/Dashboards/ManagerDHB').then(module => ({ default: module.ManagerDHB })));
const ForemanDHB = lazy(() => import('./Components/Dashboards/ForemanDHB').then(module => ({ default: module.ForemanDHB })));
const InspectorDHB = lazy(() => import('./Components/Dashboards/InspectorDHB/InspectorDHB').then(module => ({ default: module.InspectorDHB })));
const ChecklistsList = lazy(() => import('./Components/Checklists/ChecklistsList'));
const PendingApprovalsList = lazy(() => import('./Components/Checklists/PendingApprovalsList'));
const MaterialManagementPage = lazy(() => import('./Pages/MaterialManagementPage'));
const ForemanMaterialPage = lazy(() => import('./Pages/ForemanMaterialPage'));
const NotificationsPage = lazy(() => import('./Pages/NotificationsPage'));

const LoadingFallback = () => (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-slate-600">Загрузка...</p>
        </div>
    </div>
);

const Dashboard = () => {
    const userRole = AuthService.getUserRole();

    switch (userRole) {
        case 'client':
            return <ManagerDHB />;
        case 'foreman':
            return <ForemanDHB />;
        case 'inspector':
            return <InspectorDHB />;
        default:
            AuthService.logout();
            return <Navigate to="/login" />;
    }
};

const PrivateRoutes = () => {
    const isAuth = AuthService.isAuthenticated();

    return isAuth ? <MainLayout><Outlet /></MainLayout> : <Navigate to="/login" />;
};

function App() {
    return (
        <Router>
            <Suspense fallback={<LoadingFallback />}>
                <Routes>
                    <Route path="/login" element={<LoginForm />} />
                    <Route path="/register" element={<RegistrationForm />} />
                    
                    <Route element={<PrivateRoutes />}>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/projects" element={<ProjectsPage />} />
                        <Route path="/projects/:projectId" element={<ProjectDetailsPage />} />
                        <Route path="/projects/:projectId/materials" element={<MaterialManagementPage />} />
                        <Route path="/projects/:projectId/foreman-work" element={<ForemanMaterialPage />} />
                        <Route path="/map" element={<MapPage />} />
                        <Route path="/reports" element={<ReportsPage />} />
                        <Route path="/checklists" element={<ChecklistsList />} />
                        <Route path="/projects/:projectId/checklists" element={<ChecklistsList />} />
                        <Route path="/pending-approvals" element={<PendingApprovalsList />} />
                        <Route path="/notifications" element={<NotificationsPage />} />
                    </Route>

                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </Suspense>
        </Router>
    );
}

export default App;