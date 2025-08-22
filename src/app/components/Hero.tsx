"use client";
import Link from 'next/link';
import Image from 'next/image';
import hero from "../../../public/file.svg";
import { useAuth } from "../context/authContext";
import { useEffect, useState } from 'react';

const Hero: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [isPreloaded, setIsPreloaded] = useState(false);

  // Prefetch important pages on component mount
  useEffect(() => {
    // Prefetch login and register pages immediately
    const prefetchPages = async () => {
      try {
        // Prefetch critical pages
        if (typeof document !== 'undefined') {
          // Use Next.js prefetch for important pages
          const linkPrefetch = (url: string) => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = url;
            link.as = 'document';
            document.head.appendChild(link);
          };

          linkPrefetch('/login');
          linkPrefetch('/register');
          linkPrefetch('/chathome');
        }
        
        setIsPreloaded(true);
      } catch (error) {
        console.error('Prefetch error:', error);
      }
    };

    prefetchPages();
  }, []);

  // Prefetch on hover for additional optimization
  const handleLinkHover = (path: string) => {
    // Additional prefetch on hover as backup
    if (typeof document !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = path;
      link.as = 'document';
      document.head.appendChild(link);
    }
  };

  return (
    <section className="relative overflow-hidden">
      {/* 3D Background Elements */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-900 rounded-full opacity-10 mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-1/2 -right-20 w-96 h-96 bg-purple-900 rounded-full opacity-10 mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-indigo-900 rounded-full opacity-10 mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="grid max-w-screen-xl px-4 py-8 mx-auto lg:gap-8 xl:gap-0 lg:py-16 lg:grid-cols-12 relative z-10">
        <div className="mr-auto place-self-center lg:col-span-7 text-center md:text-left">
          <h1 className="max-w-2xl mb-4 text-4xl font-extrabold tracking-tight leading-none md:text-5xl xl:text-6xl text-white">
            Rapid Chat: Instant Connections, Effortless Conversations
          </h1>
          <p className="max-w-2xl mb-6 font-light lg:mb-8 md:text-lg lg:text-xl text-gray-400">
            Connect Seamlessly, Chat Effortlessly: Elevate Your Conversations
            with Our Intuitive Chat Application!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            {!isAuthenticated && (
              <Link
                href={"/login"}
                prefetch={true}
                onMouseEnter={() => handleLinkHover('/login')}
                className="inline-flex items-center justify-center px-5 py-3 text-base font-medium text-center text-white rounded-lg bg-[#1B57E9] hover:bg-blue-800 focus:ring-4 focus:ring-primary-300 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/30 transform will-change-transform"
              >
                Login
                <svg
                  className="w-5 h-5 ml-2 -mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </Link>
            )}
            {isAuthenticated && (
              <Link
                href={"/chathome"}
                prefetch={true}
                onMouseEnter={() => handleLinkHover('/chathome')}
                className="inline-flex items-center justify-center px-5 py-3 text-base font-medium text-center text-white rounded-lg bg-[#1B57E9] hover:bg-blue-800 focus:ring-4 focus:ring-primary-300 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/30 transform will-change-transform"
              >
                Chat Home
                <svg
                  className="w-5 h-5 ml-2 -mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </Link>
            )}
            {!isAuthenticated && (
              <Link
                href={"/register"}
                prefetch={true}
                onMouseEnter={() => handleLinkHover('/register')}
                className="inline-flex items-center justify-center px-5 py-3 text-base font-medium text-center border rounded-lg text-white border-gray-700 hover:bg-gray-700 focus:ring-gray-800 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-gray-500/20 transform will-change-transform"
              >
                Register
              </Link>
            )}
          </div>
        </div>
        <div className="hidden lg:mt-0 lg:col-span-5 lg:flex relative">
          <div className="absolute inset-0 bg-blue-500/10 rounded-2xl -rotate-6 scale-105"></div>
          <div className="absolute inset-0 bg-purple-500/10 rounded-2xl rotate-6 scale-105"></div>
          <Image
            src={hero}
            alt="Chat application illustration"
            className="relative transform transition-transform duration-500 hover:scale-105 hover:rotate-1 will-change-transform"
            priority // High priority for above-the-fold image
            // placeholder="blur" // Add blur placeholder
            width={500}
            height={400}
          />
        </div>
      </div>
      
      {/* Preload critical resources */}
      {isPreloaded && (
        <div className="hidden">
          {/* Preload critical API endpoints */}
          <link rel="preconnect" href={process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4001"} />
          {/* Preload fonts if you're using custom fonts */}
          <link rel="preload" as="style" href="/styles/globals.css" />
        </div>
      )}
    </section>
  );
};

export default Hero;