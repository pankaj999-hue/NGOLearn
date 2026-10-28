import { Link, useRoute } from "wouter";
import { ArrowRight, Award, CheckCircle2, ShieldCheck } from "lucide-react";
import { CAPSTONE_ITEMS } from "@shared/catalog";
import { trpc } from "@/lib/trpc";
import { useGamification } from "@/lib/gamification/useGamification";

export function CertificatePage() {
  const { snapshot: game } = useGamification();
  const cert = game.certificate;
  const earned = game.badges.filter((badge) => badge.earnedAt).length;

  if (!cert) {
    return (
      <div className="page container certificate-page">
        <div className="certificate-empty">
          <Award size={38} />
          <h1>Your certificate is waiting.</h1>
          <p>
            Complete all {CAPSTONE_ITEMS.length} capstone steps to earn a printable certificate with a public verification code.
          </p>
          <Link href="/final-project" className="button button-dark">Open the capstone <ArrowRight size={16} /></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page container certificate-page">
      <div className="certificate-sheet">
        <div className="certificate-brand">
          <span className="brand-mark"><Award size={19} /></span>
          <span>NGO<span className="brand-accent">Learn</span></span>
        </div>
        <div className="eyebrow">Community Learning Lab</div>
        <h1>Certificate of completion</h1>
        <p className="certificate-lead">
          This certifies that a learner completed the NGO Learn pathway and built a community website capstone from first click to a shareable, accessible result.
        </p>
        <div className="certificate-meta">
          <div><span>Level</span><b>{game.level.name}</b></div>
          <div><span>XP earned</span><b>{game.xp}</b></div>
          <div><span>Badges</span><b>{earned}</b></div>
        </div>
        <div className="certificate-code">
          <ShieldCheck size={16} />
          <span>Verification code <b>{cert.code}</b></span>
        </div>
        <p className="certificate-note">
          Verify this certificate at <Link href={`/verify/${cert.code}`}>/verify/{cert.code}</Link>.
          {cert.pending ? " This copy is saved on your device and will be confirmed the next time you sync." : " This certificate is securely recorded."}
        </p>
        <div className="certificate-actions">
          <button className="button button-dark" onClick={() => window.print()}><CheckCircle2 size={16} /> Print or save as PDF</button>
          <Link href="/dashboard" className="button button-outline">Back to my learning</Link>
        </div>
      </div>
    </div>
  );
}

export function VerifyPage() {
  const [, params] = useRoute<{ code: string }>("/verify/:code");
  const code = params?.code ?? "";
  const localCode = code.toUpperCase().startsWith("LOCAL-");
  const query = trpc.certificate.byCode.useQuery(
    { code },
    { enabled: Boolean(code) && !localCode, retry: false, refetchOnWindowFocus: false }
  );
  const verified = Boolean(query.data?.valid);
  const title = query.isLoading
    ? "Checking certificate..."
    : verified
      ? "Certificate verified."
      : localCode
        ? "Certificate saved on this device."
        : "Certificate not found.";

  return (
    <div className="page container certificate-page">
      <div className="certificate-empty">
        <ShieldCheck size={38} />
        <h1>{title}</h1>
        {verified ? (
          <p>
            This certificate is valid. Issued on{" "}
            <b>{new Date(query.data!.issuedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</b>.
          </p>
        ) : localCode ? (
          <p>
            This certificate is real, but it only lives on the learner&apos;s device. Public verification becomes available after progress sync is connected.
          </p>
        ) : (
          <p>{query.error ? "The verification server is unavailable right now." : "Double-check the code, or ask the learner to share their certificate link again."}</p>
        )}
        <Link href={localCode ? "/certificate" : "/"} className="button button-outline">
          {localCode ? "View certificate" : "Back to NGO Learn"}
        </Link>
      </div>
    </div>
  );
}
