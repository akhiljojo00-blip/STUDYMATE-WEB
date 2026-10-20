import React, { useState } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  RotateCcw,
  Library,
  Brain,
  LogOut,
  Menu,
  X,
  Sparkles,
  User as UserIcon,
  Shield,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { NavTab } from '../../types/index.ts';

interface AppShellProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentTab,
  onTabChange,
  children,
}) => {
  const { user, userProfile, isDemo, signOutUser, signInWithGoogle } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'subjects',
      label: 'My Subjects',
      icon: <BookOpen className="w-4 h-4" />,
    },
    {
      id: 'revision',
      label: 'Revision Room',
      icon: <RotateCcw className="w-4 h-4" />,
      badge: 'M2',
    },
    {
      id: 'library',
      label: 'Study Library',
      icon: <Library className="w-4 h-4" />,
      badge: 'M2',
    },
    {
      id: 'buddy',
      label: 'AI Study Buddy',
      icon: <Brain className="w-4 h-4" />,
      badge: 'M3',
    },
  ];

  const handleNavClick = (tab: NavTab) => {
    onTabChange(tab);
    setMobileMenuOpen(false);
  };

  const displayName = userProfile?.displayName || user?.displayName || 'Scholar';
  const email = userProfile?.email || user?.email || 'scholar@studymate.edu';
  const photoURL = userProfile?.photoURL || user?.photoURL;

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1E2320] flex flex-col md:flex-row selection:bg-[#E2DACB] selection:text-[#153225]">
      {/* Mobile Top Header */}
      <header className="md:hidden border-b border-[#EAE3D9] bg-[#FAF8F5]/95 backdrop-blur-xs px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#153225] flex items-center justify-center text-[#FAF8F5]">
            <BookOpen className="w-4 h-4" />
          </div>
          <span className="font-serif text-xl font-semibold text-[#153225]">
            StudyMate
          </span>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg text-[#1E2320] hover:bg-[#EAE3D9] transition-colors cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-[#141715]/40 backdrop-blur-xs flex">
          <div className="w-4/5 max-w-xs bg-[#FAF8F5] border-r border-[#D8CEBF] h-full flex flex-col justify-between p-5 animate-in slide-in-from-left duration-200 shadow-xl">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#EAE3D9]">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#153225] flex items-center justify-center text-[#FAF8F5]">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <span className="font-serif text-xl font-semibold text-[#153225]">
                    StudyMate
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-md text-[#88938C] hover:text-[#1E2320]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation links */}
              <nav className="mt-6 space-y-1.5">
                {navItems.map((item) => {
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[#153225] text-[#FAF8F5] shadow-xs'
                          : 'text-[#333935] hover:bg-[#F4EFEA]'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {item.icon}
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded-sm ${
                            isActive
                              ? 'bg-[#295741] text-[#FAF8F5]'
                              : 'bg-[#EAE3D9] text-[#646E68]'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Mobile Profile & Sign Out */}
            <div className="pt-4 border-t border-[#EAE3D9] space-y-3">
              <div className="flex items-center space-x-3 px-1">
                {photoURL ? (
                  <img
                    src={photoURL}
                    alt={displayName}
                    className="w-9 h-9 rounded-full object-cover border border-[#D8CEBF]"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-[#153225] text-[#FAF8F5] flex items-center justify-center text-xs font-semibold">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#1E2320] truncate">
                    {displayName}
                  </p>
                  <p className="text-[11px] text-[#88938C] truncate">{email}</p>
                </div>
              </div>

              <button
                onClick={signOutUser}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg border border-[#D8CEBF] bg-[#FFFFFF] hover:bg-[#FAF2EF] text-[#9B3D1E] text-xs font-medium transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex flex-col justify-between w-64 lg:w-72 border-r border-[#EAE3D9] bg-[#FAF8F5] p-5 shrink-0 h-screen sticky top-0 overflow-y-auto">
        <div>
          {/* Logo & Brand Header */}
          <div className="flex items-center space-x-3 px-2 py-1 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#153225] flex items-center justify-center text-[#FAF8F5] shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="font-serif text-2xl font-semibold tracking-tight text-[#153225] block">
                StudyMate
              </span>
              <span className="text-[11px] font-mono text-[#88938C] tracking-wide block">
                Production Foundation
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#153225] text-[#FAF8F5] shadow-xs'
                      : 'text-[#333935] hover:bg-[#F4EFEA]'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className={isActive ? 'text-[#FAF8F5]' : 'text-[#646E68]'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded-sm ${
                        isActive
                          ? 'bg-[#295741] text-[#FAF8F5]'
                          : 'bg-[#EAE3D9] text-[#646E68]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Demo Mode Notice */}
          {isDemo && (
            <div className="mt-8 p-3.5 rounded-xl bg-[#FAF2EF] border border-[#F2C5B6] space-y-2">
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-[#9B3D1E]">
                <Shield className="w-3.5 h-3.5" />
                <span>Demo Preview Mode</span>
              </div>
              <p className="text-[11px] text-[#646E68] leading-relaxed">
                You are currently exploring in preview mode. Sign in with Google to sync your study data with Cloud Firestore.
              </p>
              <button
                onClick={signInWithGoogle}
                className="w-full text-xs font-medium bg-[#153225] text-[#FAF8F5] py-1.5 rounded-lg hover:bg-[#1C3D2E] transition-colors cursor-pointer"
              >
                Sign in with Google
              </button>
            </div>
          )}
        </div>

        {/* User Profile Card & Sign Out */}
        <div className="pt-4 border-t border-[#EAE3D9] space-y-3">
          <div className="flex items-center space-x-3 px-2 py-1">
            {photoURL ? (
              <img
                src={photoURL}
                alt={displayName}
                className="w-9 h-9 rounded-full object-cover border border-[#D8CEBF]"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#153225] text-[#FAF8F5] flex items-center justify-center text-xs font-semibold shadow-2xs">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#1E2320] truncate">
                {displayName}
              </p>
              <p className="text-[11px] text-[#88938C] truncate">{email}</p>
            </div>
          </div>

          <button
            onClick={signOutUser}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl border border-[#D8CEBF] bg-[#FFFFFF] hover:bg-[#FAF2EF] text-[#9B3D1E] text-xs font-medium transition-colors cursor-pointer shadow-2xs"
            title="Sign out of StudyMate"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
        {children}
      </main>
    </div>
  );
};
