export const dynamic = 'force-dynamic';
import { AppSidebar } from "@/components/layout/AppSidebar";
import DataSyncProvider from "@/components/providers/DataSyncProvider";


export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <DataSyncProvider>
            <div className="flex h-screen overflow-hidden bg-background">
                <AppSidebar />
                <main className="flex-1 overflow-auto">
                    <div className="min-h-full bg-[linear-gradient(180deg,rgba(37,99,235,0.08),transparent_24%),linear-gradient(135deg,rgba(255,255,255,0.7),rgba(255,255,255,0.92))] dark:bg-[linear-gradient(180deg,rgba(96,165,250,0.08),transparent_24%),linear-gradient(135deg,rgba(15,23,42,0.7),rgba(15,23,42,0.92))]">
                        {children}
                    </div>
                </main>
            </div>
        </DataSyncProvider>
    );
}
