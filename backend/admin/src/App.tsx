import { useEffect, useState } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { SpeedInsights } from "@vercel/speed-insights/react";
import "./App.css";
import { api } from "./lib/api";
import { startAutoBackup } from "./lib/frontendBackup";
import { AdminLayout } from "./components/AdminLayout";
import { AdminAuthProvider } from "./lib/adminAuth";
import AdminDashboard from "./pages/AdminDashboard";
import AdminDestinations from "./pages/AdminDestinations";
import AdminTours from "./pages/AdminTours";
import AdminVisas from "./pages/AdminVisas";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminAccessControl from "./pages/AdminAccessControl";
import AdminHeroSettings from "./pages/AdminHeroSettings";
import AdminContacts from "./pages/AdminContacts";
import AdminApiSettings from "./pages/AdminApiSettings";
import AdminMediaLibrary from "./pages/AdminMediaLibrary";
import AdminReviews from "./pages/AdminReviews";
import AdminSEO from "./pages/AdminSEO";
import AdminBackups from "./pages/AdminBackups";
import AdminFrontendBackups from "./pages/AdminFrontendBackups";
import { SplashPreloader } from "./components/Preloader";
import { SearchProvider } from "./lib/searchContext";

export default function App() {
  const [init, setInit] = useState(true);

  useEffect(() => {
    // Kick off auto frontend backup after splash is done
    startAutoBackup(async () => {
      try {
        const [destinations, tours, visas] = await Promise.all([
          api.listDestinations(),
          api.listTours(),
          api.listVisas(),
        ]);
        return { destinations, tours, visas };
      } catch (e) {
        console.error("Backup failed", e);
        return { destinations: [], tours: [], visas: [] };
      }
    });
  }, []);

  if (init) {
    return <SplashPreloader onDone={() => setInit(false)} />;
  }

  return (
    <AdminAuthProvider>
      <SearchProvider>
        <Routes>
          {/* Admin login (no layout wrapper) */}
          <Route path="/login" element={<AdminLoginPage />} />

          {/* Admin panel (auth-gated via AdminLayout) */}
          <Route element={<AdminLayout />}>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/destinations" element={<AdminDestinations />} />
            <Route path="/tours" element={<AdminTours />} />
            <Route path="/visas" element={<AdminVisas />} />
            <Route path="/access" element={<AdminAccessControl />} />
            <Route path="/hero" element={<AdminHeroSettings />} />
            <Route path="/contacts" element={<AdminContacts />} />
            <Route path="/api-settings" element={<AdminApiSettings />} />
            <Route path="/media" element={<AdminMediaLibrary />} />
            <Route path="/reviews" element={<AdminReviews />} />
            <Route path="/seo" element={<AdminSEO />} />
            <Route path="/backups" element={<AdminBackups />} />
            <Route path="/fe-backups" element={<AdminFrontendBackups />} />
          </Route>

          {/* Catch-all redirect to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <SpeedInsights />
      </SearchProvider>
    </AdminAuthProvider>
  );
}
