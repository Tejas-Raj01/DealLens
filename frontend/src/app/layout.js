import './globals.css';

export const metadata = {
  title: 'DealLens — AI Company Research with Verified Sources',
  description: 'Upload company documents, ask questions, and get answers backed by exact source evidence.',
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
