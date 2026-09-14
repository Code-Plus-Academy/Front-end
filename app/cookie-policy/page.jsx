import React from "react";
import { CookiePolicy } from "../../src/views/Static";
import { AppLayout } from "../../src/components/layout/RouteWrappers";

export const metadata = {
  title: "Cookie Policy | FocusGram",
  description: "Learn about how FocusGram uses cookies and how you can manage them.",
  alternates: {
    canonical: "/cookie-policy",
  },
  openGraph: {
    title: "Cookie Policy | FocusGram",
    description: "Learn about how FocusGram uses cookies and how you can manage them.",
    url: "/cookie-policy",
  }
};

export default function Page() {
  return (
    <AppLayout>
      <CookiePolicy />
    </AppLayout>
  );
}
