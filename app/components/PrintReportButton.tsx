"use client";

export default function PrintReportButton() {
  return <button className="button button--dark report-print-button" type="button" onClick={() => window.print()}>Print or save PDF</button>;
}
