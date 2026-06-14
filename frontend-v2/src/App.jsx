import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Welcome from './screens/Welcome';
import Onboarding from './screens/Onboarding';
import RoleSelection from './screens/RoleSelection';
import Login from './screens/Login';
import Signup from './screens/Signup';
import ForgotPassword from './screens/ForgotPassword';
import ChildSetup from './screens/ChildSetup';
import ParentSetup from './screens/parent/ParentSetup';
import PermissionsCenter from './screens/parent/PermissionsCenter';
import ApprovalsCenter from './screens/parent/ApprovalsCenter';
import VoiceAI from './screens/parent/VoiceAI';
import ChatCenter from './screens/parent/ChatCenter';
import DetectionCenter from './screens/parent/DetectionCenter';
import UserManual from './screens/parent/UserManual';
import ChildPairing from './screens/ChildPairing';
import ConnectChild from './screens/parent/ConnectChild';
import ChildConnected from './screens/child/ChildConnected';
import ChildActivation from './screens/child/ChildActivation';
import ChildShell from './components/layout/ChildShell';
import RequireAuth from './components/RequireAuth';
import ChildHome from './screens/child/app/Home';
import ChildSOS from './screens/child/app/SOS';
import ChildContacts from './screens/child/app/Contacts';
import ChildChat from './screens/child/app/Chat';
import ChildDisha from './screens/child/app/Disha';
import ChildDishaVoice from './screens/child/app/DishaVoice';
import ChildGoals from './screens/child/app/Goals';
import ChildTasks from './screens/child/app/Tasks';
import ChildRewards from './screens/child/app/Rewards';
import ChildAchievements from './screens/child/app/Achievements';
import ChildSettingsScreen from './screens/child/app/Settings';
import TasksCenter from './screens/parent/TasksCenter';
import AIReports from './screens/parent/AIReports';
import ParentShell from './components/layout/ParentShell';
import DashboardV2 from './screens/parent/DashboardV2';
import {
  LiveLocation, SafeZones, MonitoringHub, CameraAccess, AudioMonitor, ScreenView,
  Controls, AppControls, Analytics, WeeklyReports, DailyReports, AIInsights, ActivityHistory,
  EmergencyCenter, DeviceManagement, SettingsHub, Profile, SecuritySettings, NotificationSettings,
  Appearance, LanguageSettings, InfoPage, DishaAI,
} from './screens/parent/sections';
import { SecurityCenter, ScreenTimeCenter, NightRestrictions, AppManagement, AppConfig, SafeZoneManager, DeleteAccount } from './screens/parent/centers';
import AddSafeZone from './screens/parent/AddSafeZone';
import { FamilyRadar, EmergencyCommand, AICopilot, DishaChat } from './screens/parent/centers2';
import {
  ReportsCenter, NotificationCenter, NotificationCategory, SubscriptionCenter, FamilyManagement, DataExportCenter,
  DataControlCenter, SupportCenter, ContactCenter, LegalCenter, LegalDoc, FAQPage, CompliancePage,
  VersionCenter, LicensesCenter, CopyrightCenter, SettingsHubV2,
} from './screens/parent/centers3';

const App = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname.startsWith('/app') ? '/app' : location.pathname}>
        {/* Entry */}
        <Route path="/" element={<Navigate to="/welcome" replace />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/role" element={<RoleSelection />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot" element={<ForgotPassword />} />
        <Route path="/child-setup" element={<ChildSetup />} />
        <Route path="/pairing" element={<ChildPairing />} />

        {/* Parent setup wizard (permissions, contacts, PIN) */}
        <Route path="/setup" element={<ParentSetup />} />

        {/* Mandatory onboarding gate (parent) */}
        <Route path="/connect" element={<ConnectChild />} />

        {/* Child device activation */}
        <Route path="/child/connected" element={<ChildConnected />} />
        <Route path="/child/activate" element={<ChildActivation />} />
        <Route path="/child/dashboard" element={<Navigate to="/child/app/home" replace />} />

        {/* Child Application (requires a claimed child device token) */}
        <Route path="/child/app" element={<RequireAuth role="child"><ChildShell /></RequireAuth>}>
          <Route index element={<Navigate to="/child/app/home" replace />} />
          <Route path="home" element={<ChildHome />} />
          <Route path="sos" element={<ChildSOS />} />
          <Route path="contacts" element={<ChildContacts />} />
          <Route path="chat" element={<ChildChat />} />
          <Route path="disha" element={<ChildDisha />} />
          <Route path="disha/voice" element={<ChildDishaVoice />} />
          <Route path="tasks" element={<ChildTasks />} />
          <Route path="rewards" element={<ChildRewards />} />
          <Route path="achievements" element={<ChildAchievements />} />
          <Route path="goals" element={<ChildGoals />} />
          <Route path="settings" element={<ChildSettingsScreen />} />
        </Route>

        {/* Parent Platform (requires login; ParentShell additionally locks until a child is connected) */}
        <Route path="/app" element={<RequireAuth role="parent"><ParentShell /></RequireAuth>}>
          <Route index element={<Navigate to="/app/home" replace />} />
          <Route path="home" element={<DashboardV2 />} />
          <Route path="tasks" element={<TasksCenter />} />
          <Route path="controls" element={<Controls />} />
          <Route path="screen-time" element={<ScreenTimeCenter />} />
          <Route path="night" element={<NightRestrictions />} />
          <Route path="app-management" element={<AppManagement />} />
          <Route path="app-config/:appName" element={<AppConfig />} />
          <Route path="ai" element={<AICopilot />} />
          <Route path="ai/voice" element={<VoiceAI />} />
          <Route path="chat" element={<ChatCenter />} />
          <Route path="activity" element={<ActivityHistory />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="reports" element={<AIReports />} />
          <Route path="reports/daily" element={<DailyReports />} />
          <Route path="notifications" element={<NotificationCenter />} />
          <Route path="notifications/:cat" element={<NotificationCategory />} />
          <Route path="requests" element={<ApprovalsCenter />} />
          <Route path="location" element={<FamilyRadar />} />
          <Route path="safe-zones" element={<SafeZoneManager />} />
          <Route path="safe-zones/add" element={<AddSafeZone />} />
          <Route path="emergency" element={<EmergencyCommand />} />
          <Route path="apps" element={<AppControls />} />
          <Route path="disha" element={<DishaChat />} />

          {/* Monitoring */}
          <Route path="monitoring" element={<MonitoringHub />} />
          <Route path="monitoring/camera" element={<CameraAccess />} />
          <Route path="monitoring/audio" element={<AudioMonitor />} />
          <Route path="monitoring/screen" element={<ScreenView />} />

          {/* Settings */}
          <Route path="settings" element={<SettingsHubV2 />} />
          <Route path="settings/profile" element={<Profile />} />
          <Route path="settings/security" element={<SecurityCenter />} />
          <Route path="settings/permissions" element={<PermissionsCenter />} />
          <Route path="settings/detections" element={<DetectionCenter />} />
          <Route path="settings/manual" element={<UserManual />} />
          <Route path="settings/delete" element={<DeleteAccount />} />
          <Route path="settings/notifications" element={<NotificationSettings />} />
          <Route path="settings/language" element={<LanguageSettings />} />
          <Route path="settings/appearance" element={<Appearance />} />
          <Route path="settings/devices" element={<DeviceManagement />} />
          <Route path="settings/subscription" element={<SubscriptionCenter />} />
          <Route path="settings/data" element={<DataControlCenter />} />
          <Route path="settings/export" element={<DataExportCenter />} />
          <Route path="settings/support" element={<SupportCenter />} />
          <Route path="settings/help" element={<SupportCenter />} />
          <Route path="settings/help/faq" element={<FAQPage />} />
          <Route path="settings/contact" element={<ContactCenter />} />
          <Route path="settings/legal" element={<LegalCenter />} />
          <Route path="settings/legal/:slug" element={<LegalDoc />} />
          <Route path="settings/compliance" element={<CompliancePage />} />
          <Route path="settings/about" element={<VersionCenter />} />
          <Route path="settings/licenses" element={<LicensesCenter />} />
          <Route path="settings/copyright" element={<CopyrightCenter />} />
          <Route path="settings/privacy" element={<InfoPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/welcome" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

export default App;
