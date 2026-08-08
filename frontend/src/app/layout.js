import './globals.css';

export const metadata = {
  title: 'DealLens — AI Investment Research & Due-Diligence System',
  description: 'Production AI backend system for corporate due-diligence workflows with strict page provenance citations.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
