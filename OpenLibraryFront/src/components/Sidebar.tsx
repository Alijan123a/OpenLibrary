import { FaTachometerAlt, FaBook, FaBuilding, FaUsers, FaCog } from "react-icons/fa";

export default function Sidebar({ active = "dashboard" }) {
  const nav = [
    { key: "dashboard", icon: <FaTachometerAlt size={22} />, label: "داشبورد", href: "/librarian-dashboard" },
    { key: "books", icon: <FaBook size={22} />, label: "کتاب‌ها", href: "/librarian-dashboard/books" },
    { key: "libraries", icon: <FaBuilding size={22} />, label: "کتابخانه‌ها", href: "/librarian-dashboard/libraries" },
    { key: "users", icon: <FaUsers size={22} />, label: "کاربران", href: "/librarian-dashboard/users" },
  ];

  return (
    /* fixed rounded sidebar with some right margin so it floats like your screenshot in RTL */
    <aside className="fixed right-4 top-4 bottom-4 w-28 bg-purple-600 rounded-3xl flex flex-col justify-between items-center py-6 shadow-lg z-40">
      {/* Logo area */}
      <div className="flex flex-col items-center gap-2">
        <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-purple-700/60">
          {/* replace with your logo svg if you have */}
          <div className="neon-green text-xl font-extrabold">📚</div>
        </div>
        {/* <div className="neon-green text-xs font-semibold">ONLIB</div> */}
      </div>

      {/* center nav icons (vertical) */}
      <nav className="flex flex-col items-center gap-6">
        {nav.map((n) => (
          <a
            key={n.key}
            href={n.href}
            className={`flex flex-col items-center text-sm select-none transition-colors duration-150 ${
              active === n.key ? "text-green-300" : "text-purple-100/90 hover:text-green-200"
            }`}
          >
            <div className="p-2 rounded-md">
              {n.icon}
            </div>
            <div className="mt-1 text-[12px]">{n.label}</div>
          </a>
        ))}
      </nav>

      {/* bottom settings */}
      <div className="flex flex-col items-center">
        <a href="#" className="flex flex-col items-center text-purple-100/90 hover:text-green-300">
          <FaCog size={20} />
          <div className="text-[12px] mt-1">تنظیمات</div>
        </a>
      </div>
    </aside>
  );
}
