import Link from "next/link";

const priorities = [
  {
    title: "Stay in control of your information",
    text: "Share only the details that are necessary for a learning exchange. Protect personal contact information, avoid sending sensitive details too early, and adjust your privacy settings whenever you need more control.",
  },
  {
    title: "Set healthy boundaries from the start",
    text: "Agree on the purpose, timing, and format of the exchange before moving into deeper conversations or real-world meetings. Respect boundaries and stop communicating when someone pushes for more than you are comfortable sharing.",
  },
  {
    title: "Use the platform responsibly",
    text: "Keep conversations respectful, honest, and relevant to skill-sharing. Do not use the platform to pressure, manipulate, spam, impersonate, or scam another member.",
  },
  {
    title: "Trust your instincts",
    text: "If a conversation feels uncomfortable, rushed, deceptive, or threatening, you are not expected to continue. Pause the interaction, limit further contact, and report it through the platform if needed.",
  },
];

const responseSteps = [
  "Stop engaging if a person is pressuring you, making you uncomfortable, or acting in a way that feels unsafe.",
  "Do not share private personal details, financial information, or sensitive identifiers unless you are ready and comfortable.",
  "Capture the relevant message history or profile details in case you need to report the behavior.",
  "Use the report action in the Reviews flow when available. For other incidents, contact the person operating this SkillSwap instance.",
  "If you are in immediate danger or feel threatened, contact local emergency services or a trusted person immediately.",
];

export default function SafetyCenterPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-16 text-slate-800 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-600">Safety Center</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900">A safer, more respectful SkillSwap experience</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
          SkillSwap is built around mutual learning, trust, and respect. The Safety Center explains the actions members can take to protect themselves, support one another, and keep the platform constructive and safe for everyone.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {priorities.map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-lg font-semibold text-slate-900">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
            </div>
          ))}
        </div>

        <section className="mt-10 rounded-2xl bg-amber-50 p-6">
          <h2 className="text-2xl font-semibold text-slate-900">Before meeting in person or going deeper online</h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            Take time to review a person’s profile, message history, and communication style before deciding whether the exchange is a good fit. If you are meeting in person, choose a public, familiar location, let someone trust you know where you are going, and avoid isolated settings for the first meeting.
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            A healthy exchange should feel transparent and respectful. If someone attempts to move the conversation too quickly, pressure you for personal details, or ignore your boundaries, it is appropriate to pause and disengage.
          </p>
        </section>

        <section className="mt-10 rounded-2xl bg-slate-50 p-6">
          <h2 className="text-2xl font-semibold text-slate-900">If something feels wrong</h2>
          <div className="mt-5 space-y-3">
            {responseSteps.map((step) => (
              <div key={step} className="rounded-xl border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-700">
                {step}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold text-slate-900">Reporting and moderation</h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            Reports submitted through the current app are stored for the SkillSwap instance operator. This deployment does not include an in-app moderation queue or response-time commitment; the operator is responsible for reviewing reports and deciding whether further action is appropriate.
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            The report form is currently available from the Reviews flow after an exchange. If you cannot access it or need urgent help, contact the instance operator through the support channel they provide. If you are in immediate danger, contact local emergency services.
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
