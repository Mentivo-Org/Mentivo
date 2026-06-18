'use client';

import { useSession } from "../components/SessionHandler";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LoadingModal from "../components/LoadingModal";
import { usePathname } from "next/navigation";
import MaintenancePage from "../maintenance/page";

export default function AppWrapper({
  children,
  isMaintenanceMode: initialMaintenanceMode
}: {
  children: React.ReactNode;
  isMaintenanceMode: boolean;
}) {
  const { isReady } = useSession();
  const pathname = usePathname();
  const cleanPath = pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname;
  const isPrivacyPage = cleanPath === "/privacy";
  const isAboutPage = cleanPath === "/about";
  const isSupportPage = cleanPath === "/support";
  const isTermsPage = cleanPath === "/terms";
  const isFAQPage = cleanPath === "/faq";
  const isDisclaimerPage = cleanPath === "/disclaimer";
  const isStaticPublicPage = isPrivacyPage || isAboutPage || isSupportPage || isTermsPage || isFAQPage || isDisclaimerPage;

  const isMaintenanceMode = initialMaintenanceMode && !isStaticPublicPage;

  // If we're not ready (still hydrating or validating session), render nothing.
  // This prevents the "white flash" by not rendering the initial layout 
  // until we know exactly what should be on the screen.
  // In Maintenance Mode, or on static pages like Privacy/About/Support/Terms/FAQ/Disclaimer, we show the page immediately.
  if (!isReady && !isMaintenanceMode && !isStaticPublicPage) {
    return null;
  }

  return (
    <>
      {!isMaintenanceMode && <Navbar />}
      <main className={isMaintenanceMode ? "" : "min-h-screen pt-16"}>
        {isMaintenanceMode ? <MaintenancePage /> : children}
      </main>
      {!isMaintenanceMode && <Footer />}
      <LoadingModal />
    </>
  );
}
