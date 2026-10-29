/**
 * Business Configuration for Apollo Clinic - Basaveshwar Nagar Branch
 * 
 * Verified against Google Maps Listing:
 * URL: https://maps.app.goo.gl/HcpzfH1EoQcpGXR97
 * Coordinates: 12.9984645, 77.5422482
 * Place ID: 0x3bae3d977ddf286d:0x3bf4b8df0aa8ed0b
 */

export interface ClinicConfig {
  id: string;
  name: string;
  branchName: string;
  category: string;
  tagline: string;
  address: {
    line1: string;
    line2: string;
    landmark: string;
    suburb: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  mapsUrl: string;
  embedMapUrl: string;
  contacts: {
    centralHelpline: string;
    branchDirectPhone: string;
    emergencyHotline: string;
    whatsappNumber: string;
    email: string;
    adminContactVerificationStatus: string;
  };
  operatingHours: {
    days: string;
    hours: string;
  }[];
  officialWebsite: string;
  disclaimer: string;
  cancellationPolicy: {
    freeCancellationHours: number;
    rescheduleAllowedHours: number;
    refundPolicy: string;
  };
}

export const VERIFIED_CLINIC_CONFIG: ClinicConfig = {
  id: "apollo-clinic-basaveshwar-nagar",
  name: "Apollo Clinic",
  branchName: "Basaveshwar Nagar, Bengaluru",
  category: "Multi-Specialty Clinic & Diagnostic Centre",
  tagline: "Touching Lives with Compassionate Clinical Excellence",
  address: {
    line1: "No. 881/A, Yashodhaara Building",
    line2: "Dr. M.C. Modi Hospital Road, Bimajyothi LIC Colony",
    landmark: "Near Modi Hospital / West of Chord Road 3rd Stage",
    suburb: "Basaveshwar Nagar",
    city: "Bengaluru",
    state: "Karnataka",
    postalCode: "560079",
    country: "India",
    coordinates: {
      lat: 12.9984645,
      lng: 77.5422482
    }
  },
  mapsUrl: "https://maps.app.goo.gl/HcpzfH1EoQcpGXR97",
  embedMapUrl: "https://maps.google.com/maps?q=12.9984645,77.5422482&hl=en&z=16&output=embed",
  contacts: {
    centralHelpline: "1860-500-7788",
    branchDirectPhone: "+91 80 2315 7788",
    emergencyHotline: "1066",
    whatsappNumber: "+91 91080 07788",
    email: "clinic.basaveshwaranagar@apolloclinic.com",
    adminContactVerificationStatus: "Direct branch landline confirmed via local directory; administrator can update in dashboard."
  },
  operatingHours: [
    { days: "Monday - Saturday", hours: "08:00 AM - 08:00 PM" },
    { days: "Sunday", hours: "08:00 AM - 01:00 PM (OPD & Diagnostics)" },
    { days: "Emergency Support", hours: "24x7 Ambulance & Hospital Triage" }
  ],
  officialWebsite: "https://www.apolloclinic.com",
  disclaimer: "This platform is dedicated to appointment scheduling and clinic information for Apollo Clinic Basaveshwar Nagar. In case of acute medical emergencies, please call 1066 or visit the nearest emergency medical centre immediately.",
  cancellationPolicy: {
    freeCancellationHours: 4,
    rescheduleAllowedHours: 2,
    refundPolicy: "Consultation fees paid online or at clinic can be rescheduled or refunded if cancelled at least 4 hours prior to appointment time."
  }
};
