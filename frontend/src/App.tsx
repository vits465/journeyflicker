import { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import "./App.css";
import { api } from "./lib/api";
import { startAutoBackup } from "./lib/frontendBackup";
import { SiteLayout } from "./components/SiteLayout";
import { AdminLayout } from "./components/AdminLayout";
import { AdminAuthProvider } from "./lib/adminAuth";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import DestinationsPage from "./pages/DestinationsPage";
import DestinationDetailsPage from "./pages/DestinationDetailsPage";
import FaqPage from "./pages/FaqPage";
import HomePage from "./pages/HomePage";
import ToursPage from "./pages/ToursPage";
import TourDetailsPage from "./pages/TourDetailsPage";
import VisasPage from "./pages/VisasPage";
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

import { ScrollToTop } from "./components/ScrollToTop";

export default function App() {
  const [init, setInit] = useState(true);

  useEffect(() => {
    // Kick off auto frontend backup after splash is done
    startAutoBackup(async () => {
      const [destinations, tours, visas] = await Promise.all([
        api.listDestinations(),
        api.listTours(),
        api.listVisas(),
      ]);
      return { destinations, tours, visas };
    });
  }, []);

  if (init) {
    return <SplashPreloader onDone={() => setInit(false)} />;
  }

  return (
    <AdminAuthProvider>
      <SearchProvider>
        <ScrollToTop />
        <Routes>
          {/* Public site */}
          <Route element={<SiteLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/tours" element={<ToursPage />} />
            <Route path="/tours/:id" element={<TourDetailsPage />} />
            <Route path="/destinations" element={<DestinationsPage />} />
            <Route path="/destinations/:id" element={<DestinationDetailsPage />} />
            <Route path="/visas" element={<VisasPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/contact" element={<ContactPage />} />
          </Route>

          {/* Admin login (no layout wrapper) */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Admin panel (auth-gated via AdminLayout) */}
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/destinations" element={<AdminDestinations />} />
            <Route path="/admin/tours" element={<AdminTours />} />
            <Route path="/admin/visas" element={<AdminVisas />} />
            <Route path="/admin/access" element={<AdminAccessControl />} />
            <Route path="/admin/hero" element={<AdminHeroSettings />} />
            <Route path="/admin/contacts" element={<AdminContacts />} />
            <Route path="/admin/api-settings" element={<AdminApiSettings />} />
            <Route path="/admin/media" element={<AdminMediaLibrary />} />
            <Route path="/admin/reviews" element={<AdminReviews />} />
            <Route path="/admin/seo" element={<AdminSEO />} />
            <Route path="/admin/backups" element={<AdminBackups />} />
            <Route path="/admin/fe-backups" element={<AdminFrontendBackups />} />
          </Route>
        </Routes>
      </SearchProvider>
    </AdminAuthProvider>
  );
}
