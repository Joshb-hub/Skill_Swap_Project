import Link from "next/link";

const safetyRules = [
  {
    title: "Before your first in-person or online exchange",
    text: "Take time to learn about the person behind the profile. Read their profile, review their skills and communication style, and confirm that they are genuinely aligned with your learning goals. If you are meeting in person, choose a public place, tell someone you trust where you are going, and avoid isolated or high-risk settings for your first meeting.",
  },
  {
    title: "Protect your privacy and personal information",
    text: "Never share sensitive information too early. This includes financial details, personal addresses, full telephone numbers, government-issued identifiers, banking information, passwords, private account access, or personal photos that are not needed for the exchange. Your safety and privacy should always come first.",
  },
  {
    title: "Be transparent about expectations and boundaries",
    text: "Set clear expectations for the session, communication style, skill focus, and topic boundaries. If a person pressures you to move faster, send private contact details, or change the agreement at the last minute, treat that as a red flag and stop the exchange.",
  },
  {
    title: "Speak up when something feels wrong",
    text: "If the conversation becomes manipulative, aggressive, inappropriate, or uncomfortable, stop engaging and report it. You do not need to justify your discomfort. Trust your instincts and use the platform’s reporting tools if necessary.",
  },
  {
    title: "Use the platform for learning, not exploitation",
    text: "SkillSwap is meant for mutual learning and respectful collaboration. It is not a place for harassment, coercion, extortion, scams, fake promises, or abusive behavior. Any misuse of the platform may lead to warnings, restricted access, or account removal.",
  },
  {
    title: "Support a safer community for everyone",
    text: "If you notice suspicious or harmful behavior, take a step to protect others by reporting it and documenting the relevant details. Community safety is a shared responsibility, and responsible action helps keep the platform useful for genuine learners and teachers.",
  },
];

const responsePlan = [
  "Stop communication and do not continue the exchange if you feel pressured or unsafe.",
  "Avoid sharing private contact details or personal information beyond what is necessary and appropriate.",
  "Document the relevant messages or profile details to support a report if needed.",
  "Use the report function in the platform and contact support if the issue is serious.",
  "If you are in immediate danger, contact local emergency services or a trusted person right away.",
];

export default function SafetyGuidelinesPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-16 text-slate-800 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-600">Safety Guidelines</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900">A safer, more respectful exchange experience</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
          SkillSwap is designed for trust, learning, and genuine connection. These safety guidelines are here to help members protect themselves, respect boundaries, and keep the platform welcoming and constructive for everyone.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {safetyRules.map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-lg font-semibold text-slate-900">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
            </div>
          ))}
        </div>

        <section className="mt-10 rounded-2xl bg-emerald-50 p-6">
          <h2 className="text-2xl font-semibold text-slate-900">If something feels wrong</h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            Trust your instincts. If a conversation feels manipulative, pressure-heavy, threatening, or inconsistent with the spirit of SkillSwap, disengage and take action. You are not required to accept unsafe or uncomfortable interactions simply because they are part of a learning exchange.
          </p>
          <div className="mt-5 space-y-3">
            {responsePlan.map((step) => (
              <div key={step} className="rounded-xl border border-emerald-200 bg-white p-3 text-sm leading-6 text-slate-700">
                {step}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-2xl bg-slate-50 p-6">
          <h2 className="text-2xl font-semibold text-slate-900">For in-person meetings</h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            If you meet someone in person, consider arranging the first exchange in a public, familiar setting. Share your plans with a trusted friend or family member, keep your phone charged, and avoid sharing unnecessary personal details or being pressured into moving the meeting to a private or isolated place.
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            The goal is not to overthink every interaction, but to make thoughtful, proportionate safety decisions. By treating every exchange as a professional and respectful learning experience rather than an informal social event, you can reduce risk and build trust more effectively.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold text-slate-900">Reporting and support</h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            Use the reporting tools inside the platform whenever you encounter harassment, suspicious account activity, scams, or inappropriate messages. Reports are reviewed to help keep the community safe. In serious cases, we may restrict access, temporarily disable an account, or permanently remove abusive or unsafe users.
          </p>
        </section>

        <div className="mt-10 flex flex-wrap gap-3 text-sm">
          <Link href="/community-guidelines" className="rounded-full bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-800">Community Guidelines</Link>
          <Link href="/terms-of-service" className="rounded-full border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50">Terms of Service</Link>
          <Link href="/privacy-policy" className="rounded-full border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50">Privacy Policy</Link>
        </div>
      </div>
    </main>
  );
}
