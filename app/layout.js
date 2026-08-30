import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title: "OmniCommerce | Enterprise RBAC Admin Panel",
  description: "Production-ready role-based e-commerce administration and inventory management platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
