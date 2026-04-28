import { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import "./App.css";
import { SiteLayout } from "./components/SiteLayout";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import DestinationsPage from "./pages/DestinationsPage";
import DestinationDetailsPage from "./pages/DestinationDetailsPage";
import FaqPage from "./pages/FaqPage";
import HomePage from "./pages/HomePage";
import ToursPage from "./pages/ToursPage";
import TourDetailsPage from "./pages/TourDetailsPage";
import VisasPage from "./pages/VisasPage";
import { SplashPreloader } from "./components/Preloader";
import { SearchProvider } from "./lib/searchContext";
import { ScrollToTop } from "./components/ScrollToTop";

export default function App() {
  const [init, setInit] = useState(true);

  if (init) {
    return <SplashPreloader onDone={() => setInit(false)} />;
  }

  return (
    <HelmetProvider>
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
      </Routes>
    </SearchProvider>
    </HelmetProvider>
  );
}
