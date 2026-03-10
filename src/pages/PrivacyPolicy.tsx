import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <SEOHead
        title="Privacy Policy — AI-IDEI"
        description="How AI-IDEI collects, uses, and protects your personal data."
        canonical="https://ai-idei-os.lovable.app/privacy"
      />

      <h1 className="text-2xl sm:text-3xl font-serif font-bold mb-6">Privacy Policy</h1>
      <p className="text-xs text-muted-foreground mb-8">Last updated: March 10, 2026</p>

      <article className="prose-custom space-y-6 text-sm leading-relaxed text-foreground/90">
        <section>
          <h2 className="text-lg font-semibold mb-2">1. Information We Collect</h2>
          <p>We collect information you provide directly:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Account data:</strong> email address, display name, avatar</li>
            <li><strong>Content:</strong> transcripts, audio files, text you upload for processing</li>
            <li><strong>Usage data:</strong> service runs, credit transactions, feature interactions</li>
          </ul>
          <p className="mt-2">
            We also collect technical data automatically: IP address, browser type, device information,
            and page visit timestamps.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">2. How We Use Your Data</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>To provide and improve the Service</li>
            <li>To process your content through AI pipelines</li>
            <li>To manage your account and credit balance</li>
            <li>To send important service notifications</li>
            <li>To detect and prevent abuse</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">3. Data Processing</h2>
          <p>
            Your uploaded content is processed by AI models to extract knowledge units. This processing
            happens on secure infrastructure. We do not use your private content to train our models
            without your explicit consent.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">4. Data Storage & Security</h2>
          <p>
            Your data is stored securely using industry-standard encryption. We use Row Level Security
            (RLS) to ensure users can only access their own data. Authentication is handled via
            secure JWT tokens.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">5. Data Sharing</h2>
          <p>We do not sell your personal data. We may share data with:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>AI providers:</strong> to process your content (e.g., transcription, extraction)</li>
            <li><strong>Payment processors:</strong> to handle credit top-ups</li>
            <li><strong>Law enforcement:</strong> when required by law</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">6. Your Rights (GDPR)</h2>
          <p>If you are in the EU/EEA, you have the right to:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Export your data in a portable format</li>
            <li>Object to or restrict processing</li>
          </ul>
          <p className="mt-2">
            To exercise these rights, contact us via the{" "}
            <Link to="/feedback" className="text-primary hover:underline">feedback form</Link>.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">7. Cookies</h2>
          <p>
            We use essential cookies for authentication and session management. We do not use
            third-party advertising cookies. Analytics cookies (if enabled) are used to understand
            platform usage patterns.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">8. Data Retention</h2>
          <p>
            We retain your data for as long as your account is active. Upon account deletion,
            we remove your personal data within 30 days, except where retention is required by law.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">9. Children's Privacy</h2>
          <p>
            The Service is not directed to children under 16. We do not knowingly collect data
            from children.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">10. Changes to This Policy</h2>
          <p>
            We may update this policy periodically. We will notify you of significant changes
            via email or in-app notification.
          </p>
        </section>
      </article>
    </div>
  );
}
