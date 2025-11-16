import { useRouter } from "next/router";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  Settings,
  LogOut,
  ChevronRight,
  Bot,
  MessageSquare,
  AlertCircle,
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Orders",
    href: "/orders",
    icon: ShoppingBag,
  },
  {
    title: "Machines",
    href: "/viewMachines",
    icon: Bot,
  },
  {
    title: "Menu Items",
    href: "/items",
    icon: Package,
  },
  {
    title: "Admins",
    href: "/viewAdmins",
    icon: Users,
  },
  {
    title: "Reports",
    href: "/reports",
    icon: AlertCircle,
  },
  {
    title: "Feedback",
    href: "/feedbacks",
    icon: MessageSquare,
  },
];

export function AppSidebar() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("Token");
    router.push("/auth/login");
  };

  const isActive = (href: string) => {
    if (href === "/") return router.pathname === "/";
    return router.pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      {/* Logo / Brand */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold">GolBot</span>
            <span className="text-xs text-muted-foreground">Admin CRM</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={active ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3",
                    active && "bg-brand/10 text-brand hover:bg-brand/20 hover:text-brand"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="flex-1 text-left">{item.title}</span>
                  {item.badge && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-xs text-white">
                      {item.badge}
                    </span>
                  )}
                  {active && <ChevronRight className="h-4 w-4" />}
                </Button>
              </Link>
            );
          })}
        </div>
      </ScrollArea>

      <Separator />

      {/* User Profile Section */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3 rounded-lg p-2 hover:bg-accent">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-gradient-to-br from-brand-500 to-brand-700 text-white">
              A
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm font-medium">Admin</p>
            <p className="text-xs text-muted-foreground">admin@golbot.in</p>
          </div>
        </div>

        <Button
          variant="ghost"
          className="mt-2 w-full justify-start gap-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );
}
