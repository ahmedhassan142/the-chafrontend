"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/app/context/authContext";
import { useProfile } from "@/app/context/profileContext";

const LandingNav = () => {
  const { isAuthenticated, logout } = useAuth();
  const { userDetails } = useProfile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [prefetched, setPrefetched] = useState(false);

  // Prefetch important pages on component mount
  useEffect(() => {
    const prefetchPages = () => {
      if (typeof document !== 'undefined' && !prefetched) {
        // Prefetch all navigation pages
        const pagesToPrefetch = [
          '/',
          '/About',
          '/Contact',
          '/dashboard',
          '/login',
          '/register',
          '/chathome'
        ];

        pagesToPrefetch.forEach(page => {
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.href = page;
          link.as = 'document';
          document.head.appendChild(link);
        });

        setPrefetched(true);
      }
    };

    // Prefetch after a short delay to avoid blocking critical resources
    const timer = setTimeout(prefetchPages, 500);
    return () => clearTimeout(timer);
  }, [prefetched]);

  // Handle link hover for additional prefetching
  const handleLinkHover = (path: string) => {
    if (typeof document !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = path;
      link.as = 'document';
      document.head.appendChild(link);
    }
  };

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav className="bg-gray-900/50 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
        {/* Logo/Brand */}
        <Link 
          href="/" 
          className="flex items-center space-x-3 rtl:space-x-reverse"
          prefetch={true}
          onMouseEnter={() => handleLinkHover('/')}
        >
          <img
            src="https://flowbite.com/docs/images/logo.svg"
            className="h-8"
            alt="Swift Logo"
          />
          <span className="self-center text-2xl font-semibold whitespace-nowrap text-white">
            Rapid-Chat
          </span>
        </Link>

        {/* Mobile menu button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          type="button"
          className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-white rounded-lg md:hidden hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-600"
          aria-controls="navbar-default"
          aria-expanded={isMenuOpen}
        >
          <span className="sr-only">Open main menu</span>
          <svg
            className="w-5 h-5"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 17 14"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M1 1h15M1 7h15M1 13h15"
            />
          </svg>
        </button>

        {/* Navigation Links - Desktop */}
        <div className="hidden w-full md:flex md:w-auto" id="navbar-default">
          <ul className="font-medium flex flex-col p-4 md:p-0 mt-4 border border-gray-700 rounded-lg bg-gray-800 md:flex-row md:space-x-8 rtl:space-x-reverse md:mt-0 md:border-0 md:bg-transparent">
            {/* Dashboard Link - Only show for admin */}
            {isAuthenticated && userDetails?.email === "ah770643@gmail.com" && (
              <li>
                <Link
                  href="/dashboard"
                  prefetch={true}
                  onMouseEnter={() => handleLinkHover('/dashboard')}
                  className="block py-2 px-3 text-gray-400 hover:text-[#1B57E9] rounded hover:bg-gray-700 md:hover:bg-transparent md:p-0 transition-colors duration-300"
                >
                  Dashboard
                </Link>
              </li>
            )}

            <li>
              <Link
                href="/"
                prefetch={true}
                onMouseEnter={() => handleLinkHover('/')}
                className="block py-2 px-3 text-white hover:text-[#1B57E9] rounded md:bg-transparent md:p-0 transition-colors duration-300"
              >
                Home
              </Link>
            </li>

            <li>
              <Link
                href="/About"
                prefetch={true}
                onMouseEnter={() => handleLinkHover('/About')}
                className="block py-2 px-3 text-gray-400 hover:text-[#1B57E9] rounded hover:bg-gray-700 md:hover:bg-transparent md:p-0 transition-colors duration-300"
              >
                About
              </Link>
            </li>

            <li>
              <Link
                href="/Contact"
                prefetch={true}
                onMouseEnter={() => handleLinkHover('/Contact')}
                className="block py-2 px-3 text-gray-400 hover:text-[#1B57E9] rounded hover:bg-gray-700 md:hover:bg-transparent md:p-0 transition-colors duration-300"
              >
                Contact
              </Link>
            </li>

           
          </ul>
        </div>

        {/* Mobile menu */}
        <div
          className={`${isMenuOpen ? "block" : "hidden"} w-full md:hidden`}
          id="navbar-default"
        >
          <ul className="font-medium flex flex-col p-4 mt-4 border border-gray-700 rounded-lg bg-gray-800">
            {/* Dashboard Link - Only show for admin */}
            {isAuthenticated && userDetails?.email === "ah770643@gmail.com" && (
              <li>
                <Link
                  href="/dashboard"
                  prefetch={true}
                  onClick={closeMenu}
                  className="block py-2 px-3 text-gray-400 hover:text-[#1B57E9] rounded hover:bg-gray-700 transition-colors duration-300"
                >
                  Dashboard
                </Link>
              </li>
            )}

            <li>
              <Link
                href="/"
                prefetch={true}
                onClick={closeMenu}
                className="block py-2 px-3 text-white hover:text-[#1B57E9] rounded hover:bg-gray-700 transition-colors duration-300"
              >
                Home
              </Link>
            </li>

            <li>
              <Link
                href="/About"
                prefetch={true}
                onClick={closeMenu}
                className="block py-2 px-3 text-gray-400 hover:text-[#1B57E9] rounded hover:bg-gray-700 transition-colors duration-300"
              >
                About
              </Link>
            </li>

            <li>
              <Link
                href="/Contact"
                prefetch={true}
                onClick={closeMenu}
                className="block py-2 px-3 text-gray-400 hover:text-[#1B57E9] rounded hover:bg-gray-700 transition-colors duration-300"
              >
                Contact
              </Link>
            </li>

         
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default LandingNav;