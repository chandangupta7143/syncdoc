import { Link } from 'react-router-dom';

export default function CTASection() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900" />

      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary-500/10 rounded-full translate-x-1/3 translate-y-1/3" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary-500/20 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
          Ready to transform how
          <br />
          your team works?
        </h2>
        <p className="mt-6 text-lg text-primary-100 max-w-xl mx-auto leading-relaxed">
          Join thousands of teams already using SyncDoc to collaborate faster, write smarter, and ship better work together.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/signup"
            className="w-full sm:w-auto text-center px-8 py-4 text-sm font-bold text-primary-700 bg-white rounded-xl shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all"
          >
            Get Started Free
          </Link>
          <Link
            to="/dashboard"
            className="w-full sm:w-auto text-center px-8 py-4 text-sm font-semibold text-white rounded-xl border-2 border-white/30 hover:bg-white/10 transition-all"
          >
            Schedule a Demo
          </Link>
        </div>
        <p className="mt-6 text-sm text-primary-200">
          No credit card required • Free plan available forever
        </p>
      </div>
    </section>
  );
}
