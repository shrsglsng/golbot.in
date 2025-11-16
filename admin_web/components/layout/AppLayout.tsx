import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { Toaster } from "sonner";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  showSearch?: boolean;
}

export function AppLayout({ children, title, description, showSearch }: AppLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <AppSidebar />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader title={title} description={description} showSearch={showSearch} />

        <main className="flex-1 overflow-y-auto bg-muted/40 p-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>

      {/* Toast notifications */}
      <Toaster position="top-right" />
    </div>
  );
}
