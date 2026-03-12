import { Link } from 'react-router-dom';

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-400/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary-400/25 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-200/20 rounded-full blur-3xl animate-pulse [animation-delay:2s]" />
      </div>

      <div className="mx-auto max-w-7xl px-6 py-20 flex flex-col lg:flex-row items-center gap-16">
        {/* Left – copy */}
        <div className="flex-1 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50 border border-primary-200 mb-6">
            <span className="w-2 h-2 rounded-full bg-secondary-500 animate-pulse" />
            <span className="text-xs font-semibold text-primary-700 tracking-wide uppercase">
              Now in Public Beta
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
            <span className="text-surface-900">Collaborate in </span>
            <span className="bg-gradient-to-r from-primary-600 via-primary-500 to-secondary-500 bg-clip-text text-transparent">
              Real-Time
            </span>
            <br />
            <span className="text-surface-900">with </span>
            <span className="bg-gradient-to-r from-secondary-500 to-primary-500 bg-clip-text text-transparent">
              AI Superpowers
            </span>
          </h1>

          <p className="mt-6 text-lg text-surface-700 max-w-xl mx-auto lg:mx-0 leading-relaxed">
            SyncDoc brings teams together with a collaborative editor, integrated chat, smart permissions, and AI that helps you write, summarize, and polish — all in one beautiful workspace.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
            <Link
              to="/signup"
              className="w-full sm:w-auto text-center px-8 py-3.5 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 shadow-xl shadow-primary-500/25 hover:shadow-primary-500/40 hover:-translate-y-0.5 transition-all"
            >
              Start Free
            </Link>
            <Link
              to="/dashboard"
              className="w-full sm:w-auto text-center px-8 py-3.5 text-sm font-semibold text-primary-600 rounded-xl border-2 border-primary-200 hover:border-primary-400 hover:bg-primary-50 transition-all"
            >
              Watch Demo
            </Link>
          </div>

          <div className="mt-10 flex items-center gap-6 justify-center lg:justify-start text-sm text-surface-700">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-secondary-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Free forever plan</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-secondary-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>No credit card</span>
            </div>
          </div>
        </div>

        {/* Right – floating editor preview */}
        <div className="flex-1 w-full max-w-lg lg:max-w-xl">
          <div className="relative group">
            {/* Glow behind the card */}
            <div className="absolute -inset-4 bg-gradient-to-r from-primary-500/20 to-secondary-500/20 rounded-3xl blur-2xl opacity-60 group-hover:opacity-80 transition-opacity" />

            {/* Card */}
            <div className="relative bg-white rounded-2xl shadow-2xl border border-surface-200/80 overflow-hidden">
              {/* Title bar */}
              <div className="flex items-center gap-2 px-5 py-3 bg-surface-50 border-b border-surface-200/60">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="w-3 h-3 rounded-full bg-green-400" />
                <span className="ml-3 text-xs font-medium text-surface-700">Project Roadmap.syncdoc</span>
              </div>

              {/* Editor mockup */}
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold">A</div>
                  <div className="flex-1">
                    <div className="h-3 bg-surface-200 rounded-full w-3/4" />
                    <div className="h-2 bg-surface-100 rounded-full w-1/2 mt-1.5" />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="h-3 bg-surface-100 rounded-full w-full" />
                  <div className="h-3 bg-surface-100 rounded-full w-5/6" />
                  <div className="h-3 bg-primary-100 rounded-full w-4/6 border-l-2 border-primary-500" />
                  <div className="h-3 bg-surface-100 rounded-full w-3/4" />
                </div>

                {/* Collaboration cursors */}
                <div className="flex items-center gap-2 mt-4">
                  <div className="flex -space-x-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-secondary-400 to-secondary-600 border-2 border-white flex items-center justify-center text-white text-[10px] font-bold">S</div>
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 border-2 border-white flex items-center justify-center text-white text-[10px] font-bold">M</div>
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 border-2 border-white flex items-center justify-center text-white text-[10px] font-bold">J</div>
                  </div>
                  <span className="text-xs text-surface-700">3 collaborators editing</span>
                </div>

                {/* AI suggestion bar */}
                <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl border border-primary-100">
                  <svg className="w-4 h-4 text-primary-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                  </svg>
                  <span className="text-xs font-medium text-primary-700">AI Suggestion: Rephrase for clarity?</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
