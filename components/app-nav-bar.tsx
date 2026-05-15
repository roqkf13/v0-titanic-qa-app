import Link from "next/link";
import { LogIn } from "lucide-react";

export function AppNavBar() {
  return (
    <nav className="sticky top-0 z-50 shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100 hover:opacity-80 transition-opacity"
        >
          Titanic QA
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/titanic"
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
          >
            [타이타닉]
          </Link>
          <button
            type="button"
            aria-label="로그인"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
          >
            <LogIn size={16} aria-hidden="true" />
            로그인
          </button>
        </div>
      </div>
    </nav>
  );
}
