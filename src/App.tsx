/**
 * Apollo Clinic Premium Appointment Booking Platform
 * Branch: Basaveshwar Nagar, Bengaluru
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import HomePage from './pages/HomePage';
import ServicesPage from './pages/ServicesPage';
import DoctorsPage from './pages/DoctorsPage';
import DoctorProfilePage from './pages/DoctorProfilePage';
import BookingWizardPage from './pages/BookingWizardPage';
import BookingConfirmationPage from './pages/BookingConfirmationPage';
import PatientPortalPage from './pages/PatientPortalPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AboutContactPage from './pages/AboutContactPage';
import LegalPage from './pages/LegalPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: 1
    }
  }
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased selection:bg-sky-100 selection:text-sky-900">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/doctors" element={<DoctorsPage />} />
              <Route path="/doctors/:id" element={<DoctorProfilePage />} />
              <Route path="/book" element={<BookingWizardPage />} />
              <Route path="/confirmation/:reference" element={<BookingConfirmationPage />} />
              <Route path="/patient-portal" element={<PatientPortalPage />} />
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/about" element={<AboutContactPage />} />
              <Route path="/legal" element={<LegalPage />} />
              {/* Fallback */}
              <Route path="*" element={<HomePage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
