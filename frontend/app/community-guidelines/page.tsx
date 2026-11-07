import Link from "next/link";

const guidelines = [
  {
    title: "Be respectful and honest",
    text: "Treat every member with respect. Use truthful profile information, clear communication, and courteous language in messages, requests, and sessions. Do not harass, insult, threaten, or manipulate others.",
  },
  {
    title: "Keep exchanges safe and professional",
    text: "SkillSwap is for learning and teaching, not coercion, pressure, or inappropriate behavior. Keep sessions respectful, maintain clear boundaries, and never request sensitive personal details before a trusted exchange has formed.",
  },
  {
    title: "Protect privacy",
    text: "Respect other people’s privacy settings, do not collect or share personal contact information without permission, and avoid posting screenshots, private messages, or account details publicly.",
  },
  {
    title: "No fraud, spam, or abuse",
    text: "Do not impersonate people, run scams, post spam, or manipulate reviews, matches, or requests. Authentic participation keeps the community trustworthy for everyone.",
  },
  {
    title: "Report issues early",
    text: "If you encounter harassment, suspicious behavior, safety concerns, or policy violations, report it through the platform immediately. We review reports to protect the community and maintain a fair experience.",
  },
];

export default function CommunityGuidelinesPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16 text-slate-800 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-600">Community Guidelines</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900">A respectful, trustworthy exchange community</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
          SkillSwap is built around mutual learning, generosity, and accountability. These guidelines help keep the platform safe, respectful, and useful for everyone.
        </p>

        <div className="mt-8 space-y-5">
          {guidelines.map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-lg font-semibold text-slate-900">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl bg-indigo-50 p-6">
          <h2 className="text-xl font-semibold text-slate-900">Moderation and reporting</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            We may review, restrict, or remove content or accounts that violate these guidelines. Members are expected to report inappropriate behavior quickly so the community can stay safe and inclusive.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap gap-3 text-sm">
          <Link href="/settings" className="rounded-full bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-800">
            Privacy Preferences
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
