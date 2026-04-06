import './globals.css';

export const metadata = {
  title: 'Gobuddy Chat - Real-Time Dashboard',
  description: 'Premium real-time chat application created for Adverayze.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
