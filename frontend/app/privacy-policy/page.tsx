import Link from "next/link";

const sections = [
  {
    title: "1. Information we collect",
    text: "We collect the information needed to create and maintain your account, including your name, username, email address, profile details, skill interests, learning goals, location details, and activity relevant to skill exchanges. We may also process records of messages, requests, session participation, notifications, and technical information used to keep the platform secure and functional.",
  },
  {
    title: "2. How we use your information",
    text: "We use account and profile data to create a personalized experience, connect people with compatible learning partners, support messaging and request coordination, improve the quality of matches, detect suspicious activity, and send service-related notifications. We also use anonymized and aggregated data to better understand how users interact with the platform and improve product quality over time.",
  },
  {
    title: "3. Contact information and visibility controls",
    text: "Your email address, phone number, and other contact details are protected by your account privacy settings and by platform rules. They are not displayed publicly by default. Contact visibility depends on your settings and the context of the exchange. You are responsible for using contact details appropriately and respecting the privacy preferences others set on their account.",
  },
  {
    title: "4. Information sharing",
    text: "We do not sell personal information. We may share information with trusted internal tools, service providers, or moderation systems only when necessary to operate the platform, verify accounts, prevent abuse, maintain security, or comply with legal obligations. We limit that sharing to what is needed for the specific purpose and protect it using security controls.",
  },
  {
    title: "5. Cookies, device data, and platform analytics",
    text: "SkillSwap may process limited technical information such as browser type, device information, page activity, IP address, performance logs, and session metadata. This helps us maintain security, understand product usage, prevent abuse, and improve the platform. Some information may be collected through standard web technical mechanisms and analytics tools configured for the service.",
  },
  {
    title: "6. Data security and protection",
    text: "We protect account data using modern technical and organizational safeguards, including account hashing, token-based authentication, access controls, and restricted server-side access. No digital system is completely risk-free, and we encourage members to use strong credentials, keep accounts private, and quickly report unusual or suspicious activity.",
  },
  {
    title: "7. Data retention and deletion",
    text: "Your information is retained only as long as necessary to provide the service, support moderation, maintain trust and safety, comply with legal obligations, or document legitimate business processes. If you delete or deactivate your account, we will stop using it for active service operations and apply our retention and security rules to ensure appropriate handling of the data.",
  },
  {
    title: "8. Your rights and choices",
    text: "You can update your profile and privacy preferences from your account settings, manage your notification choices, and control what information is visible to others. If you need help reviewing, correcting, limiting, or deleting personal data, you can contact support through the platform and we will guide you through the appropriate steps within the limits of the service and applicable law.",
  },
  {
    title: "9. Children, vulnerable users, and sensitive contexts",
    text: "SkillSwap is intended for adults and users who are legally able to participate in a community learning environment. Members should not use the platform to target minors or vulnerable users in inappropriate ways. The platform is not a place for exploitative, manipulative, or unsafe interactions, and we may take action to protect vulnerable members.",
  },
  {
    title: "10. Contact and policy updates",
    text: "If you have questions about how your data is used, how to manage your account privacy, or how to exercise your rights, contact the support team through the platform. We may update this Privacy Policy from time to time to reflect legal changes, product improvements, and evolving security practices. Continued use of the platform after a change is posted means you accept the revised policy.",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-16 text-slate-800 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-600">Privacy Policy</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900">Your privacy matters at SkillSwap</h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          SkillSwap is designed to help people learn and teach with trust and respect. This Privacy Policy explains what information we collect, how it is used, how we protect it, and what choices you have when managing your account and profile.
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
          <h2 className="text-xl font-semibold text-slate-900">Security and accountability</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            We are committed to maintaining a secure service and protecting member information from misuse, unauthorized access, and unnecessary exposure. If you believe your account or data has been compromised, contact support immediately so we can investigate and help mitigate risk.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap gap-3 text-sm">
          <Link href="/community-guidelines" className="rounded-full border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50">Community Guidelines</Link>
          <Link href="/safety-center" className="rounded-full border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50">Safety Center</Link>
          <Link href="/terms-of-service" className="rounded-full border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50">Terms of Service</Link>
        </div>
      </div>
    </main>
  );
}
