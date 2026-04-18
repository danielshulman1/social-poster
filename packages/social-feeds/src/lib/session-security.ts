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

export const sessionNeedsMfaVerification = (session: SessionLike | TokenLike) => false;

export const sessionNeedsMfaEnrollment = (session: SessionLike | TokenLike) => false;

export const getSensitiveActionRedirectPath = (session: SessionLike | TokenLike) => null;
