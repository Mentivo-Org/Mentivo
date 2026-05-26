'use client';

import { useSession } from "../components/SessionHandler";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LoadingModal from "../components/LoadingModal";

export default function AppWrapper({
  children,
  isMaintenanceMode
}: {
  children: React.ReactNode;
  isMaintenanceMode: boolean;
}) {
  const { isReady } = useSession();

  // If we're not ready (still hydrating or validating session), render nothing.
  // This prevents the "white flash" by not rendering the initial layout 
  // until we know exactly what should be on the screen.
  // In Maintenance Mode, we show the page immediately.
  if (!isReady && !isMaintenanceMode) {
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
