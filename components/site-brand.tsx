import { GraduationCap } from "lucide-react";

type SiteBrandProps = {
  siteName: string;
  tagline: string;
  logoUrl?: string | null;
  logoAlt?: string;
  showTagline?: boolean;
  compact?: boolean;
};

export function SiteBrand({
  siteName,
  tagline,
  logoUrl = null,
  logoAlt = "",
  showTagline = true,
  compact = false,
}: SiteBrandProps) {
  return (
    <span className="brand-lockup">
      <span className={`brand-symbol ${logoUrl ? "has-site-logo" : ""}`} aria-hidden={!logoUrl}>
        {logoUrl ? (
          <img src={logoUrl} alt={logoAlt || siteName} />
        ) : (
          <GraduationCap size={compact ? 20 : 23} strokeWidth={2.4} aria-hidden="true" />
        )}
      </span>
      <span className="brand-copy">
        <strong>{siteName}</strong>
        {!compact && showTagline && tagline ? <small>{tagline}</small> : null}
      </span>
    </span>
  );
}
