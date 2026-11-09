import Link from "next/link";

const sections = [
  {
    title: "1. Acceptance of terms",
    text: "By creating an account, using SkillSwap, or participating in any learning exchange, you agree to these Terms of Service. These terms describe how the platform operates, what responsibilities you accept as a member, and the expectations for respectful participation. If you do not agree with these terms, you should not use the platform or create an account.",
  },
  {
    title: "2. Eligibility and account responsibility",
    text: "You are responsible for the accuracy of the information you provide and for keeping your credentials secure. You must use only your own account and are responsible for all activity conducted through it. If you discover unauthorized access or suspicious use, you should notify us immediately and take steps to secure the account.",
  },
  {
    title: "3. Purpose of the platform",
    text: "SkillSwap exists to support people who want to teach, learn, and connect through skill-based exchange. The platform is designed to help members discover compatibility, coordinate exchanges, share interests, and build learning relationships. It is not intended as a general-purpose social network, employment platform, or transactional marketplace unrelated to skill-sharing.",
  },
  {
    title: "4. Community conduct and prohibited use",
    text: "Users must act lawfully and respectfully. You may not use the platform to harass, threaten, manipulate, impersonate, defraud, spam, misrepresent your identity, or engage in discriminatory or abusive conduct. Activity that harms another member, damages trust, or undermines the learning environment may be restricted or removed.",
  },
  {
    title: "5. Exchanges, sessions, and offline meetings",
    text: "Users may arrange learning sessions, teaching exchanges, or other collaboration arrangements through the platform. SkillSwap facilitates the introduction and coordination of these interactions, but the actual exchange is between users. We are not responsible for the quality, safety, outcome, or legality of any in-person or online meeting arranged off-platform.",
  },
  {
    title: "6. Safety and privacy expectations",
    text: "Members are expected to use good judgment when communicating, sharing information, and meeting others. You should respect privacy settings, avoid sharing unnecessary personal information, and stop interacting when a person makes you uncomfortable or attempts to pressure or manipulate you. We encourage all users to review the Safety Guidelines and Privacy Policy before engaging in a new exchange.",
  },
  {
    title: "7. Content, profile data, and intellectual property",
    text: "You retain ownership of content you create, upload, or post, but you grant SkillSwap a limited license to store, process, display, and moderate that content as required to operate the service. You must not publish content that violates copyright, privacy, or another person’s rights, and you must not post material designed to deceive, mislead, or exploit others.",
  },
  {
    title: "8. Messaging, ratings, and reviews",
    text: "Messages, reviews, and profile content should be truthful, relevant, and respectful. You may not manipulate ratings, create false reviews, coordinate deceptive behavior, or misuse the platform for dishonest gain. SkillSwap may remove or restrict content that appears misleading, abusive, or inconsistent with community standards.",
  },
  {
    title: "9. Moderation, restrictions, and account actions",
    text: "Reports submitted through the current app are stored for the SkillSwap instance operator. This deployment does not include an in-app moderation queue or response-time commitment. The operator is responsible for reviewing reports and deciding what action, if any, is appropriate under these terms and applicable law.",
  },
  {
    title: "10. Service availability and changes",
    text: "The platform is provided on an as-is basis. We do not guarantee uninterrupted service, complete availability, zero errors, or specific outcomes from any user-to-user exchange. SkillSwap may change features, limit access, improve the service, or update these terms to reflect improvements, business needs, or legal requirements.",
  },
  {
    title: "11. Limitation of liability and dispute resolution",
    text: "To the maximum extent allowed by law, SkillSwap is not liable for incidental, consequential, or indirect damages arising from use of the service or from user-to-user interactions. If a dispute arises between members, the user interaction itself is primarily the responsibility of the participants involved. The platform can assist with moderation and reporting, but it does not guarantee dispute resolution or enforce outcomes between members.",
  },
];

export default function TermsOfServicePage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-16 text-slate-800 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-600">Terms of Service</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900">Terms for using the SkillSwap platform</h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          These terms govern your access to the SkillSwap platform and your participation in the community. Please read them carefully before creating an account, listing skills, joining a match, or arranging an exchange. By using the site, you acknowledge that you understand and agree to these responsibilities.
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
            We may update these terms from time to time to reflect product improvements, legal requirements, security needs, and community expectations. Continued use of SkillSwap after changes are posted constitutes acceptance of the revised terms. If a substantial change is made, we may notify users through the platform or by other reasonable means.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap gap-3 text-sm">
          <Link href="/community-guidelines" className="rounded-full border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50">Community Guidelines</Link>
          <Link href="/safety-center" className="rounded-full border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50">Safety Center</Link>
          <Link href="/privacy-policy" className="rounded-full border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50">Privacy Policy</Link>
        </div>
      </div>
    </main>
  );
}
