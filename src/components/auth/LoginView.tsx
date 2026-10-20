import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { BookOpen, Brain, Sparkles, CheckCircle2, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { signInWithGoogle, enterDemoMode, loading, error, clearError } = useAuth();

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1E2320] flex flex-col justify-between selection:bg-[#E2DACB] selection:text-[#153225]">
      {/* Subtle top branding banner */}
      <header className="border-b border-[#EAE3D9] bg-[#FAF8F5]/90 backdrop-blur-xs px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-[#153225] flex items-center justify-center text-[#FAF8F5] shadow-xs">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="font-serif text-2xl font-semibold tracking-tight text-[#153225]">
              StudyMate
            </span>
            <span className="ml-2 text-xs font-mono uppercase tracking-wider text-[#BA4E29] bg-[#FBE4DD] px-1.5 py-0.5 rounded-sm">
              Milestone 1
            </span>
          </div>
        </div>

        <button
          onClick={enterDemoMode}
          className="text-xs md:text-sm font-medium text-[#153225] hover:text-[#BA4E29] underline underline-offset-4 transition-colors"
        >
          Explore Preview Mode
        </button>
      </header>

      {/* Main hero & auth container */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 md:py-16">
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Mission & Highlights */}
          <div className="md:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#EAE3D9]/60 border border-[#D8CEBF] text-xs font-medium text-[#153225]">
              <Sparkles className="w-3.5 h-3.5 text-[#BA4E29]" />
              <span>Personalised, deliberate learning workspace</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal leading-[1.08] tracking-tight text-[#153225]">
              Study with intention, <br />
              <span className="italic text-[#BA4E29]">retain with confidence.</span>
            </h1>

            <p className="text-base sm:text-lg text-[#333935] leading-relaxed max-w-xl">
              Understand core concepts, practise active retrieval, identify knowledge gaps early, and track genuine academic growth in one thoughtful workspace.
            </p>

            {/* Value pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-3.5 rounded-xl border border-[#EAE3D9] bg-[#F4EFEA]/60">
                <div className="flex items-center space-x-2 text-[#153225] font-semibold text-sm mb-1">
                  <CheckCircle2 className="w-4 h-4 text-[#1C3D2E]" />
                  <span>Subject Ownership</span>
                </div>
                <p className="text-xs text-[#646E68] leading-normal">
                  Curate your syllabus, target hours, and study focus with private Cloud Firestore sync.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-[#EAE3D9] bg-[#F4EFEA]/60">
                <div className="flex items-center space-x-2 text-[#153225] font-semibold text-sm mb-1">
                  <Brain className="w-4 h-4 text-[#BA4E29]" />
                  <span>Active Retrieval</span>
                </div>
                <p className="text-xs text-[#646E68] leading-normal">
                  Spaced repetition and mistake archaeology designed for deep conceptual retention.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Authentication Card */}
          <div className="md:col-span-5">
            <div className="bg-[#FFFFFF] border border-[#D8CEBF] rounded-2xl p-6 sm:p-8 shadow-sm">
              <div className="text-center pb-6 border-b border-[#EAE3D9]">
                <h2 className="font-serif text-2xl font-semibold text-[#153225]">
                  Student Sign In
                </h2>
                <p className="text-xs sm:text-sm text-[#646E68] mt-1">
                  Access your private academic workspace
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="mt-4 p-3 rounded-lg bg-[#FAF2EF] border border-[#F2C5B6] text-[#9B3D1E] text-xs flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p>{error}</p>
                    <button
                      onClick={clearError}
                      className="text-[11px] underline mt-1 font-medium block"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 space-y-3.5">
                <button
                  type="button"
                  onClick={signInWithGoogle}
                  disabled={loading}
                  className="w-full flex items-center justify-center space-x-3 px-4 py-3 rounded-xl border border-[#D8CEBF] bg-[#FFFFFF] hover:bg-[#F4EFEA] text-[#1E2320] font-medium text-sm transition-all focus:outline-hidden focus:ring-2 focus:ring-[#153225] focus:ring-offset-2 disabled:opacity-60 cursor-pointer shadow-2xs"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{loading ? 'Connecting...' : 'Continue with Google'}</span>
                </button>

                <div className="relative flex py-2 items-center">
                  <div className="grow border-t border-[#EAE3D9]"></div>
                  <span className="shrink mx-3 text-xs uppercase tracking-wider text-[#88938C]">or</span>
                  <div className="grow border-t border-[#EAE3D9]"></div>
                </div>

                <button
                  type="button"
                  onClick={enterDemoMode}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-[#F4EFEA] hover:bg-[#EAE3D9] text-[#153225] font-medium text-xs sm:text-sm transition-colors border border-[#D8CEBF] cursor-pointer"
                >
                  <span>Explore as Demo Scholar</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#BA4E29]" />
                </button>
              </div>

              {/* Security & Isolation Guarantee */}
              <div className="mt-6 pt-5 border-t border-[#EAE3D9] flex items-start space-x-2 text-[11px] text-[#646E68]">
                <ShieldCheck className="w-4 h-4 text-[#1C3D2E] shrink-0 mt-0.5" />
                <p>
                  Secure cloud isolation: Your subjects and academic data are encrypted and accessible only by your authenticated identity.
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#EAE3D9] px-6 py-4 text-center text-xs text-[#88938C]">
        StudyMate Platform &bull; Milestone 1: Production Web Foundation &bull; Cloud Firestore & Firebase Auth
      </footer>
    </div>
  );
};
