import Link from "next/link";

const principles = [
  {
    title: "Respectful communication",
    text: "SkillSwap works best when people speak to each other with courtesy, clarity, and respect. Constructive feedback, kind language, and thoughtful replies help every exchange feel safe and effective. Harassment, insults, sarcasm meant to shame someone, or repeated pressure messages are not acceptable.",
  },
  {
    title: "Honest and complete profiles",
    text: "Profiles should reflect real experience, genuine skills, and accurate personal information. Members should not misrepresent qualifications, pretend to be someone else, create fake identities, or use misleading descriptions to gain trust or manipulate others.",
  },
  {
    title: "Safe and appropriate skill exchanges",
    text: "Learning exchanges should focus on teaching, practice, and meaningful growth. Sessions should remain professional and appropriate for the context, with clear expectations and healthy boundaries. Don’t pressure someone to move off-platform too quickly or request sensitive personal details before trust has formed.",
  },
  {
    title: "Consent, privacy, and boundaries",
    text: "Respect personal limits. Do not pressure people to share private contact details, personal addresses, financial information, personal photos, or other sensitive information. If someone declines, stops replying, or asks for space, respect that decision without continuing to push.",
  },
  {
    title: "No fraud, spam, or abuse",
    text: "Do not spam users, create deceptive outreach campaigns, impersonate trusted people, or manipulate matches, reviews, requests, or ratings. Fake accounts, scam attempts, and coordinated abuse degrade trust for everyone and may result in moderation action.",
  },
  {
    title: "Report problems early",
    text: "If you see harassment, suspicious behavior, scams, policy violations, or threatening interactions, use the report action when it is available and preserve relevant details. The current report form is available from the Reviews flow after an exchange; for other incidents, contact the person operating this SkillSwap instance.",
  },
];

const examples = [
  "Good: a clear profile, respectful messages, and honest teaching goals.",
  "Good: agreeing on session details, availability, and boundaries before meeting.",
  "Bad: repeated follow-ups after a user declines or asks for space.",
  "Bad: requesting personal financial information, government IDs, or secret account access.",
  "Bad: impersonating an expert, posting misleading reviews, or trying to defraud another member.",
];

export default function CommunityGuidelinesPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-16 text-slate-800 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-600">Community Guidelines</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900">A respectful, trustworthy exchange community</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
          SkillSwap is built around mutual learning, generosity, and accountability. We created this platform to make it easier for people to learn, teach, and connect with trust. These guidelines are designed to keep the experience positive, safe, and constructive for everyone.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {principles.map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-lg font-semibold text-slate-900">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
            </div>
          ))}
        </div>

        <section className="mt-10 rounded-2xl bg-indigo-50 p-6">
          <h2 className="text-2xl font-semibold text-slate-900">What good participation looks like</h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            Healthy participation on SkillSwap is built on trust, reciprocity, and accountability. Members should communicate clearly, keep promises, respect another person’s time and boundaries, and treat each exchange as a learning relationship rather than a transactional shortcut.
          </p>
          <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-700">
            <li>• Be prompt and respectful when replying to messages or requests.</li>
            <li>• Set realistic expectations for session length, content, and goals.</li>
            <li>• Confirm details of the exchange before meeting in person or sharing further information.</li>
            <li>• Give and receive feedback in a way that is helpful, respectful, and actionable.</li>
            <li>• Protect trust by acting responsibly even outside the app when a real-world interaction occurs.</li>
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold text-slate-900">Examples of unacceptable behavior</h2>
          <div className="mt-5 space-y-3">
            {examples.map((example) => (
              <div key={example} className="rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
                {example}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-2xl bg-slate-50 p-6">
          <h2 className="text-2xl font-semibold text-slate-900">Moderation and reporting</h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            Reports submitted through the current app are stored for the SkillSwap instance operator. This deployment does not include an in-app moderation queue or response-time commitment; the operator is responsible for reviewing reports and deciding whether further action is appropriate.
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            If something feels unsafe, manipulative, or inappropriate, document what happened and use the available report action. If that action does not fit the incident, contact the instance operator using the support channel they provide.
          </p>
        </section>

        <div className="mt-10 flex flex-wrap gap-3 text-sm">
          <Link href="/safety-center" className="rounded-full bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-800">Safety Center</Link>
          <Link href="/terms-of-service" className="rounded-full border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50">Terms of Service</Link>
          <Link href="/privacy-policy" className="rounded-full border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50">Privacy Policy</Link>
        </div>
      </div>
    </main>
  );
}
