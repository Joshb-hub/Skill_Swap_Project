import Link from "next/link";

const sections = [
  {
    title: "Information we collect",
    text: "We collect the information needed to create and maintain your account, such as your name, username, email, phone number, location, profile details, learning interests, skills, and exchange activity. We also process limited security and usage information needed to keep the platform safe and functioning.",
  },
  {
    title: "How we use your information",
    text: "We use your information to create your profile, connect you with compatible learners and teachers, support messaging and session coordination, improve platform safety, and provide account-related notifications. We may also use aggregated, non-identifying information to understand platform trends and improve the experience.",
  },
  {
    title: "How contact details are handled",
    text: "Your email address and phone number are protected by the privacy controls in your account settings. They are not publicly exposed by default. Contact visibility is limited by your chosen privacy preferences and by the platform’s rules for peer-to-peer exchanges.",
  },
  {
    title: "Information sharing",
    text: "We do not sell personal data. We may share necessary information with trusted internal systems, service providers, or moderation tools to operate the platform, verify accounts, prevent abuse, or comply with legal requirements.",
  },
  {
    title: "Data security",
    text: "We protect account data with modern security practices, including hashed passwords, signed access tokens, and restricted server-side access. No system is completely risk-free, so we encourage members to safeguard their credentials and report suspicious activity quickly.",
  },
  {
    title: "Data retention and deletion",
    text: "Information is kept for as long as needed to provide the service, support trust and safety, and meet legal or business obligations. If you deactivate or delete your account, we will stop using it for active service operations and apply the retention practices described by our product and security policies.",
  },
  {
    title: "Your rights and choices",
    text: "You can update your profile and privacy controls in your Settings area. You may also choose which contact details are visible to other members and manage notification preferences for your account.",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16 text-slate-800 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-600">Privacy Policy</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900">Your privacy matters at SkillSwap</h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          SkillSwap is designed to help people learn and teach with trust and respect. This policy explains what information we collect, how we use it, and how we protect it.
        </p>

        <div className="mt-8 space-y-6">
          {sections.map((section) => (
            <section key={section.title} className="border-b border-slate-200 pb-5 last:border-none last:pb-0">
              <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{section.text}</p>
            </section>
          ))}
        </div>

        <div className="mt-10 rounded-2xl bg-emerald-50 p-6">
          <h2 className="text-xl font-semibold text-slate-900">Contact us</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            If you have questions about privacy, account settings, or how your data is used, contact the support team through the platform’s help and support channels.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap gap-3 text-sm">
          <Link href="/settings" className="rounded-full bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-800">
            Privacy Preferences
          </Link>
          <Link href="/community-guidelines" className="rounded-full border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50">
            Community Guidelines
          </Link>
          <Link href="/terms-of-service" className="rounded-full border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50">
            Terms of Service
          </Link>
        </div>
      </div>
    </main>
  );
}
