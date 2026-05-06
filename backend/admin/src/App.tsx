import { useEffect, useState, lazy, Suspense } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import "./App.css";
import { api } from "./lib/api";
import { startAutoBackup } from "./lib/frontendBackup";
import { AdminLayout } from "./components/AdminLayout";
import { AdminAuthProvider } from "./lib/adminAuth";
import { SplashPreloader } from "./components/Preloader";
import { SearchProvider } from "./lib/searchContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AdminLoader } from "./components/AdminLoader";

// Lazy load admin pages
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminDestinations = lazy(() => import("./pages/AdminDestinations"));
const AdminTours = lazy(() => import("./pages/AdminTours"));
const AdminVisas = lazy(() => import("./pages/AdminVisas"));
const AdminLoginPage = lazy(() => import("./pages/AdminLoginPage"));
const AdminAccessControl = lazy(() => import("./pages/AdminAccessControl"));
const AdminHeroSettings = lazy(() => import("./pages/AdminHeroSettings"));
const AdminContacts = lazy(() => import("./pages/AdminContacts"));
const AdminApiSettings = lazy(() => import("./pages/AdminApiSettings"));
const AdminMediaLibrary = lazy(() => import("./pages/AdminMediaLibrary"));
const AdminReviews = lazy(() => import("./pages/AdminReviews"));
const AdminSEO = lazy(() => import("./pages/AdminSEO"));
const AdminBackups = lazy(() => import("./pages/AdminBackups"));
const AdminFrontendBackups = lazy(() => import("./pages/AdminFrontendBackups"));
const AdminBackupManager = lazy(() => import("./pages/AdminBackupManager"));
const AdminImportExport  = lazy(() => import("./pages/AdminImportExport"));
const AdminSystemLogs    = lazy(() => import("./pages/AdminSystemLogs"));

export default function App() {
  const [init, setInit] = useState(true);

  useEffect(() => {
    // Kick off auto frontend backup after splash is done
    startAutoBackup(async () => {
      const token = sessionStorage.getItem("jf_token");
      if (!token) return { destinations: [], tours: [], visas: [] };
      try {
        const [destinations, toursRaw, visas] = await Promise.all([
          api.listDestinations(),
          api.listTours(),
          api.listVisas(),
        ]);
        const tours = Array.isArray(toursRaw) ? toursRaw : toursRaw.items;
        return { destinations, tours, visas };
      } catch (e) {
        return { destinations: [], tours: [], visas: [] };
      }
    });
  }, []);

  if (init) {
    return <SplashPreloader onDone={() => setInit(false)} />;
  }

  return (
    <ThemeProvider>
      <AdminAuthProvider>
        <SearchProvider>
          <Suspense fallback={<AdminLoader />}>
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
                <Route path="/backup-manager" element={<AdminBackupManager />} />
                <Route path="/import-export"  element={<AdminImportExport />} />
                <Route path="/system-logs"     element={<AdminSystemLogs />} />
              </Route>

              {/* Catch-all redirect to dashboard */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </SearchProvider>
      </AdminAuthProvider>
    </ThemeProvider>
  );
}
