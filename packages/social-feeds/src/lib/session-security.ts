type SessionLike = {
  user?: {
    mfaRequired?: boolean | null;
    mfaVerified?: boolean | null;
    mfaEnrollmentRequired?: boolean | null;
  } | null;
} | null;

type TokenLike = {
  mfaRequired?: boolean | null;
  mfaVerified?: boolean | null;
  mfaEnrollmentRequired?: boolean | null;
} | null;

export const sessionNeedsMfaVerification = (session: SessionLike | TokenLike) =>
  Boolean(session && "mfaRequired" in (session as TokenLike)
    ? (session as TokenLike).mfaRequired && !(session as TokenLike).mfaVerified
    : (session as SessionLike)?.user?.mfaRequired && !(session as SessionLike)?.user?.mfaVerified);

export const sessionNeedsMfaEnrollment = (session: SessionLike | TokenLike) =>
  Boolean(session && "mfaEnrollmentRequired" in (session as TokenLike)
    ? (session as TokenLike).mfaEnrollmentRequired
    : (session as SessionLike)?.user?.mfaEnrollmentRequired);

export const getSensitiveActionRedirectPath = (session: SessionLike | TokenLike) => {
  if (sessionNeedsMfaEnrollment(session)) {
    return "/settings?security=mfa-required";
  }

  if (sessionNeedsMfaVerification(session)) {
    return "/mfa";
  }

  return null;
};
