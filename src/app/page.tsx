"use client";

import { usePrivy } from "@privy-io/react-auth";
import { FullScreenLoader } from "@/components/ui/fullscreen-loader";
import AppHeader from "@/components/app-header";
import Portfolio from "@/components/portfolio";

function Home() {
  const { ready, authenticated, login } = usePrivy();
  
  if (!ready) {
    return <FullScreenLoader />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      {authenticated ? (
        <main className="pt-24 pb-12 px-4">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
              Your Portfolio, Your Control
            </h1>
            <p className="text-gray-600 mb-8">Manage your assets with ease</p>
            
            <Portfolio />
          </div>
        </main>
      ) : (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="text-center space-y-8 px-4">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-bold text-gray-900">
                Your Portfolio,<br />Your Control
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Manage your crypto portfolio with smart rebalancing on Moonbeam
              </p>
            </div>
            
            <button
              onClick={() => {
                login();
                setTimeout(() => {
                  (document.querySelector('input[type="email"]') as HTMLInputElement)?.focus();
                }, 150);
              }}
              className="bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
            >
              Get Started
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
