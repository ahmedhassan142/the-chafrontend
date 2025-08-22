// app/page.tsx (Home Page)
"use client"

import dynamic from 'next/dynamic';
const  Home= dynamic(() => import('./Home/page'), {
  loading: () => <div className="h-64 bg-gray-700 rounded-xl animate-pulse"></div>,
});

const Page = () => {
  return (
    <div>
     
      <Home/>
      
    </div>
  );
};

export default Page;