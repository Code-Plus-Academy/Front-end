import React from "react";
import { GrievanceOfficer } from "../../../src/views/Static";
import { AppLayout } from "../../../src/components/layout/RouteWrappers";

export const metadata = {
  title: "Grievance Officer & Timelines | FocusGram",
  description: "Grievance Officer contact details and legal timelines under IT Rules 2021 & DPDP Act 2023 for FocusGram.",
  alternates: {
    canonical: "/legal/grievance-officer",
  },
  openGraph: {
    title: "Grievance Officer | FocusGram",
    description: "Grievance Officer contact details and legal timelines under IT Rules 2021 & DPDP Act 2023 for FocusGram.",
    url: "/legal/grievance-officer",
  }
};

export default function Page() {
  return (
    <AppLayout>
      <GrievanceOfficer />
    </AppLayout>
  );
}
