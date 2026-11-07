import Link from "next/link";

const safetyRules = [
  {
    title: "Meet in safe, appropriate spaces",
    text: "Use SkillSwap to arrange respectful learning exchanges. Prefer public, familiar locations for initial in-person meetings and keep conversations focused on skill-sharing and mutual learning.",
  },
  {
    title: "Protect personal information",
    text: "Never share sensitive personal details, payment information, government IDs, or private account access before a trusted relationship has formed and both participants are comfortable.",
  },
  {
    title: "Be transparent and respectful",
    text: "Share accurate availability, expectations, and boundaries. Avoid pressure, coercion, manipulation, or repeated contact after someone has declined or asked for space.",
  },
  {
    title: "Report concerning behavior immediately",
    text: "If someone sends inappropriate messages, requests sensitive information, or creates unsafe conditions, report the account and stop interacting immediately. We review reports to help protect the community.",
  },
  {
    title: "Use the platform responsibly",
    text: "Do not use SkillSwap to harass, scam, impersonate, or exploit others. Misuse of the site, fake profiles, or abusive communication can lead to restrictions or account removal.",
  },
];

export default function SafetyGuidelinesPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16 text-slate-800 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-600">Safety Guidelines</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900">A safer, more respectful exchange experience</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
          SkillSwap is designed for trust, learning, and genuine connection. These safety guidelines help members protect themselves, respect boundaries, and keep the platform welcoming for everyone.
        </p>

        <div className="mt-8 space-y-5">
          {safetyRules.map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-lg font-semibold text-slate-900">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl bg-emerald-50 p-6">
          <h2 className="text-xl font-semibold text-slate-900">If something feels wrong</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Trust your instincts. If a conversation escalates, feels manipulative, or requests private information too quickly, disengage, block the user if needed, and report the behavior through the platform.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap gap-3 text-sm">
          <Link href="/community-guidelines" className="rounded-full bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-800">
            Community Guidelines
          </Link>
          <Link href="/terms-of-service" className="rounded-full border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50">
            Terms of Service
          </Link>
          <Link href="/privacy-policy" className="rounded-full border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50">
            Privacy Policy
          </Link>
        </div>
      </div>
    </main>
  );
}
