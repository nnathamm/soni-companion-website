import type { Metadata } from "next";
import RemoteDisplay from "@/app/components/RemoteDisplay";

export const metadata: Metadata = { title: "Household display", robots: { index: false, follow: false } };

export default function DisplayPage() {
  return <RemoteDisplay />;
}
