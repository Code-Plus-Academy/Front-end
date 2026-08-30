import React from "react";
import { GrievanceOfficer } from "../../src/views/Static";
import { AppLayout } from "../../src/components/layout/RouteWrappers";

export const metadata = {
  title: "Copyright & Notice-and-Takedown Policy | FocusGram",
  description: "Understand the Copyright Policy and Notice-and-Takedown timelines under the IT Rules 2021 on FocusGram.",
  alternates: {
    canonical: "/copyright-policy",
  },
  openGraph: {
    title: "Copyright & Notice-and-Takedown Policy | FocusGram",
    description: "Understand the Copyright Policy and Notice-and-Takedown timelines under the IT Rules 2021 on FocusGram.",
    url: "/copyright-policy",
  }
};

export default function Page() {
  return (
    <AppLayout>
      <GrievanceOfficer />
    </AppLayout>
  );
}
