import Link from "next/link";

const sections = [
  {
    title: "1. Acceptance of terms",
    text: "By creating an account, using SkillSwap, or participating in any exchange, you agree to these Terms of Service. If you do not agree, you should not use the platform.",
  },
  {
    title: "2. Your account",
    text: "You are responsible for the accuracy of your account information, your password security, and all activity associated with your profile. Keep your login credentials secure and notify us if you suspect unauthorized use.",
  },
  {
    title: "3. Community use",
    text: "SkillSwap is intended for lawful and respectful skill-sharing, teaching, learning, and collaboration. You may not use the platform for harassment, discrimination, spam, fraud, illegal activities, or any behavior that harms others.",
  },
  {
    title: "4. Exchanges and sessions",
    text: "Users may arrange learning exchanges, skill sessions, or communication through the platform. SkillSwap facilitates introductions and coordination, but the exchange itself is between users. We are not responsible for the outcome, safety, or quality of offline meetings.",
  },
  {
    title: "5. Content and intellectual property",
    text: "You retain ownership of your own content, but by sharing it on SkillSwap you grant the platform a limited license to display, store, and process it as needed to provide the service. Do not share content you do not have permission to publish.",
  },
  {
    title: "6. Privacy and safety",
    text: "Personal information and contact details are protected according to our privacy settings and policy. You are responsible for using contact information appropriately and for respecting the privacy controls chosen by other members.",
  },
  {
    title: "7. Suspension or termination",
    text: "SkillSwap may suspend or terminate accounts that violate these terms, misuse the system, or create unreasonable risk to other members. We may also remove or restrict content when necessary to protect the platform and the community.",
  },
  {
    title: "8. Limitation of liability",
    text: "SkillSwap is provided on an as-is basis. We do not guarantee uninterrupted service, error-free performance, or guaranteed outcomes from interactions between users. Our liability is limited to the extent permitted by applicable law.",
  },
];

export default function TermsOfServicePage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16 text-slate-800 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-600">Terms of Service</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900">Terms for using the SkillSwap platform</h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          These terms govern your access to SkillSwap and your participation in the community. Please read them carefully before creating an account or joining an exchange.
        </p>

        <div className="mt-8 space-y-6">
          {sections.map((section) => (
            <section key={section.title} className="border-b border-slate-200 pb-5 last:border-none last:pb-0">
              <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{section.text}</p>
            </section>
          ))}
        </div>

        <div className="mt-10 rounded-2xl bg-slate-50 p-6">
          <h2 className="text-xl font-semibold text-slate-900">Changes to these terms</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            We may update these terms from time to time to reflect product improvements, legal requirements, and community needs. Continued use of SkillSwap after updates means you accept the revised terms.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap gap-3 text-sm">
          <Link href="/community-guidelines" className="rounded-full border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50">
            Community Guidelines
          </Link>
          <Link href="/safety-guidelines" className="rounded-full border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50">
            Safety Guidelines
          </Link>
          <Link href="/privacy-policy" className="rounded-full border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50">
            Privacy Policy
          </Link>
          <Link href="/settings" className="rounded-full bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-800">
            Privacy Preferences
          </Link>
        </div>
      </div>
    </main>
  );
}
