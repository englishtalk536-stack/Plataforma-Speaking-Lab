export function areAccountInvitationsEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.NODE_ENV !== 'production' || env.ACCOUNT_INVITATIONS_ENABLED === 'true';
}
