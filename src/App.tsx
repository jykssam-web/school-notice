import { Routes, Route, HashRouter } from "react-router-dom";
import LandingView from "./views/LandingView";
import ChalkboardView from "./views/ChalkboardView";
import AdminView from "./views/AdminView";
import HelpView from "./views/HelpView";
import MasterAdminView from "./views/MasterAdminView";
import ChalkboardSetupView from "./views/ChalkboardSetupView";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<LandingView />} />
        <Route path="/setup" element={<ChalkboardSetupView />} />
        <Route path="/master-admin" element={<MasterAdminView />} />
        <Route path="/:schoolId/display/:channelId" element={<ChalkboardView />} />
        <Route path="/admin" element={<AdminView />} />
        <Route path="/:schoolId/admin" element={<AdminView />} />
        <Route path="/:schoolId/admin/:channelId" element={<AdminView />} />
        <Route path="/admin/help" element={<HelpView />} />
      </Routes>
    </HashRouter>
  );
}