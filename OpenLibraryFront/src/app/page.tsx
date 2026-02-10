export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 text-center">
          به کتابخانه آنلاین خوش آمدید
        </h1>
        <p className="text-gray-600 text-center mb-6">
          سامانه مدیریت کتابخانه دیجیتال شما
        </p>
        <div className="space-y-3">
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200">
            مرور کتاب‌ها
          </button>
          <button className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition duration-200">
            ورود کتابدار
          </button>
          <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition duration-200">
            ورود دانشجو
          </button>
        </div>
      </div>
    </div>
  );
}
