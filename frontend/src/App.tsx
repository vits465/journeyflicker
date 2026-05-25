import { useEffect, useState, lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import "./App.css";
import { SiteLayout } from "./components/SiteLayout";
import { SplashPreloader } from "./components/Preloader";
import { SearchProvider } from "./lib/searchContext";
import { ScrollToTop } from "./components/ScrollToTop";
import { ThemeProvider } from "./context/ThemeContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Toaster } from "react-hot-toast";
import { installErrorReporter } from "./lib/errorReporter";

// Install global error reporter immediately (before any rendering)
installErrorReporter();

// Lazy Load Pages
const HomePage = lazy(() => import("./pages/HomePage"));
const ToursPage = lazy(() => import("./pages/ToursPage"));
const TourDetailsPage = lazy(() => import("./pages/TourDetailsPage"));
const DestinationsPage = lazy(() => import("./pages/DestinationsPage"));
const DestinationDetailsPage = lazy(() => import("./pages/DestinationDetailsPage"));
const VisasPage = lazy(() => import("./pages/VisasPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const FaqPage = lazy(() => import("./pages/FaqPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const TermsAndConditionsPage = lazy(() => import("./pages/TermsAndConditionsPage"));
const DataDeletionPage = lazy(() => import("./pages/DataDeletionPage"));
const BespokePage = lazy(() => import("./pages/BespokePage"));

export default function App() {
  const [init, setInit] = useState(true);

  if (init) {
    return <SplashPreloader onDone={() => setInit(false)} />;
  }

  return (
    <HelmetProvider>
      <ThemeProvider>
        <SearchProvider>
          <ScrollToTop />
          <ErrorBoundary>
            <Toaster 
              position="bottom-center"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#111',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '999px',
                  fontSize: '12px',
                  letterSpacing: '0.05em',
                  padding: '12px 24px',
                },
              }}
            />
            <Suspense fallback={<SplashPreloader onDone={() => {}} />}>
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
                  <Route path="/bespoke" element={<BespokePage />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                  <Route path="/terms-and-conditions" element={<TermsAndConditionsPage />} />
                  <Route path="/data-deletion" element={<DataDeletionPage />} />
                </Route>
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </SearchProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}
