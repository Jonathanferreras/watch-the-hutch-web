import { AuthProvider } from "@/src/features/auth/components/auth-provider";

export default function AdminRootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <AuthProvider>{children}</AuthProvider>;
}
