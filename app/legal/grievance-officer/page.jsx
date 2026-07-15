import React from "react";
import { GrievanceOfficer } from "../../../src/views/Static";
import { AppLayout } from "../../../src/components/layout/RouteWrappers";

export const metadata = {
  title: "Grievance Officer & Timelines",
  description: "Grievance Officer contact details and legal timelines under IT Rules 2021 & DPDP Act 2023.",
  alternates: {
    canonical: "/legal/grievance-officer",
  },
  openGraph: {
    title: "Grievance Officer | Code Plus Academy",
    description: "Grievance Officer contact details and legal timelines under IT Rules 2021 & DPDP Act 2023.",
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
