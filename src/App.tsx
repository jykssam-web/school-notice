/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingView from "./views/LandingView";
import ChalkboardView from "./views/ChalkboardView";
import AdminView from "./views/AdminView";
import HelpView from "./views/HelpView";
import MasterAdminView from "./views/MasterAdminView";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingView />} />
        <Route path="/master-control" element={<MasterAdminView />} />
        <Route path="/:schoolId" element={<LandingView />} />
        <Route path="/:schoolId/display/:channelId" element={<ChalkboardView />} />
        <Route path="/admin" element={<AdminView />} />
        <Route path="/:schoolId/admin" element={<AdminView />} />
        <Route path="/:schoolId/admin/:channelId" element={<AdminView />} />
        <Route path="/admin/help" element={<HelpView />} />
      </Routes>
    </Router>
  );
}
