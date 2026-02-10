import Sidebar from "./Sidebar";

interface AdminLayoutProps {
  children: React.ReactNode;
  active?: string;
}

export default function AdminLayout({ children, active = "dashboard" }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar active={active} />
      {/* main area: give right margin to make space for the fixed sidebar in RTL */}
      <div className="mr-36">
        {/* top bar */}
        <header className="flex items-center justify-start p-6">
          <div className="flex items-center gap-3">
            <div className="text-left">
              <div className="font-semibold">کاربر مدیر</div>
              <div className="text-xs text-gray-500">مدیر</div>
            </div>
            <img
              src="https://i.pravatar.cc/40"
              alt="avatar"
              className="w-10 h-10 rounded-full border"
            />
          </div>
        </header>

        {/* page content */}
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
