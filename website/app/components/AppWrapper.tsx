'use client';

import { useSession } from "../components/SessionHandler";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LoadingModal from "../components/LoadingModal";
import { usePathname } from "next/navigation";

export default function AppWrapper({
  children,
  isMaintenanceMode: initialMaintenanceMode
}: {
  children: React.ReactNode;
  isMaintenanceMode: boolean;
}) {
  const { isReady } = useSession();
  const pathname = usePathname();

  // If we're on the privacy or about page, we don't treat it as maintenance mode
  // so that Navbar and Footer are visible.
  const isPrivacyPage = pathname === "/privacy";
  const isAboutPage = pathname === "/about";
  const isMaintenanceMode = initialMaintenanceMode && !isPrivacyPage && !isAboutPage;

  // If we're not ready (still hydrating or validating session), render nothing.
  // This prevents the "white flash" by not rendering the initial layout 
  // until we know exactly what should be on the screen.
  // In Maintenance Mode, or on static pages like Privacy/About, we show the page immediately.
  if (!isReady && !isMaintenanceMode && !isPrivacyPage && !isAboutPage) {
    return null;
  }

  return (
    <>
      {!isMaintenanceMode && <Navbar />}
      <main className={isMaintenanceMode ? "" : "min-h-screen pt-16"}>
        {children}
      </main>
      {!isMaintenanceMode && <Footer />}
      <LoadingModal />
    </>
  );
}
