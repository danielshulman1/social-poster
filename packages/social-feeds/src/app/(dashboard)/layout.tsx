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
            <div className="app-page-shell bg-transparent lg:flex">
                <AppSidebar />
                <main className="flex-1 overflow-auto">
                    <div className="min-h-full bg-[radial-gradient(circle_at_top_right,rgba(229,140,98,0.12),transparent_24%),radial-gradient(circle_at_top_left,rgba(45,127,122,0.12),transparent_22%)]">
                        {children}
                    </div>
                </main>
            </div>
        </DataSyncProvider>
    );
}
