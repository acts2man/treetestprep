import { useState, type ComponentType, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Settings,
} from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";

type NavItem = { label: string; to: string; icon: ComponentType<{ className?: string }> };

const adminNav: NavItem[] = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
  { label: "Classes", to: "/admin/classes", icon: CalendarDays },
  { label: "Instructors", to: "/admin/instructors", icon: GraduationCap },
  { label: "Resources", to: "/admin/resources", icon: BookOpen },

  { label: "Website Pages", to: "/admin/pages", icon: FileText },
  { label: "Settings", to: "/admin/settings", icon: Settings },
];

const normalize = (path: string) =>
  path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;

function SidebarNav({
  items,
  rootPath,
  onSelect,
}: {
  items: NavItem[];
  rootPath: string;
  onSelect?: (() => void) | undefined;
}) {
  const pathname = normalize(
    useRouterState({ select: (state) => state.location.pathname }),
  );

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
      {items.map((item) => {
        const to = normalize(item.to);
        const active = to === rootPath ? pathname === rootPath : pathname.startsWith(to);
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onSelect}
            className={
              active
                ? "flex items-center gap-3 rounded-lg bg-[#1d3770] px-3 py-2.5 text-sm font-medium text-white shadow-[0_10px_30px_-12px_rgba(29,55,112,0.9)]"
                : "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 transition hover:bg-white/5 hover:text-white"
            }
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarBody({
  items,
  rootPath,
  onSelect,
}: {
  items: NavItem[];
  rootPath: string;
  onSelect?: (() => void) | undefined;
}) {
  const { signOut } = useAuth();

  return (
    <div className="flex h-full flex-col bg-[#05070d]">
      <div className="flex h-24 items-center bg-[#1d3770] px-4">
        <Link to="/" className="block">
          <img
            src="/assets/tree-test-prep-logo.webp"
            alt="Tree Test Prep"
            className="h-20 w-auto max-w-full object-contain"
          />
        </Link>
      </div>
      <SidebarNav items={items} rootPath={rootPath} onSelect={onSelect} />
      <div className="border-t border-white/10 px-3 py-4">
        <button
          type="button"
          onClick={() => void signOut()}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 transition hover:bg-rose-500/10 hover:text-rose-300"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
        <p className="mt-3 px-3 text-xs text-white/40">
          Tree Test Prep © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

export function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { profile, user, signOut } = useAuth();
  const items = adminNav;
  const rootPath = "/admin";
  const name = profile?.display_name || user?.email?.split("@")[0] || "there";
  const initials = (profile?.display_name || user?.email || "T").slice(0, 2).toUpperCase();
  const subtitle = "Here's what's happening across your arborist certification courses today.";

  return (
    <div className="dashboard-shell min-h-screen bg-[#0a0f1e] text-white">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/10 lg:block">
        <SidebarBody items={items} rootPath={rootPath} />
      </aside>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 border-white/10 bg-[#05070d] p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarBody items={items} rootPath={rootPath} onSelect={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 bg-[#05070d] px-4 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setOpen(true)}
              className="rounded-md p-2 text-white/80 transition hover:bg-white/10 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex min-w-0 items-center gap-3 rounded-full py-1 pl-1 pr-3 outline-none transition hover:bg-white/10">
                <Avatar className="h-9 w-9 border border-white/20">
                  {profile?.avatar_url ? <AvatarImage src={profile.avatar_url} alt="" /> : null}
                  <AvatarFallback className="bg-[#1d3770] text-xs text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="min-w-0 text-left">
                  <span className="block truncate text-sm font-semibold text-white">
                    Welcome back, {name}
                  </span>
                   <span className="block truncate text-xs text-white/50">Admin Console</span>
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72">
                <DropdownMenuLabel>
                  <span className="block font-semibold">Welcome back, {name}!</span>
                  <span className="mt-1 block text-xs font-normal text-muted-foreground">
                    {subtitle}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/admin/settings/">Change profile photo</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/admin/settings/">Edit profile</Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link to="/admin/settings/">
                    Account settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/">View public website</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => void signOut()}>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Notifications"
              className="relative rounded-md p-2 text-white/80 transition hover:bg-white/10"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#349e49]" />
            </button>
            <Link
              to="/admin/settings/"
              aria-label="Settings"
              className="rounded-md p-2 text-white/80 transition hover:bg-white/10"
            >
              <Settings className="h-5 w-5" />
            </Link>
          </div>
        </header>

        <main className="px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

export default DashboardLayout;
