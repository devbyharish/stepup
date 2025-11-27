// planner workflow helper - small finite state helper
export const PlannerStates = {
  Draft: 'Draft',
  Submitted: 'Submitted',
  InProgress: 'InProgress',
  SentForSignoff: 'SentForSignoff',
  SignedOff: 'SignedOff',
  Rejected: 'Rejected'
};

export function canTransition(current, action, role) {
  // action: submit, approve, start, sendForSignoff, signoff, reject
  if (action === 'submit' && current === PlannerStates.Draft && role === 'educator') return true;
  if (action === 'approve' && current === PlannerStates.Submitted && role === 'supervisor') return true;
  if (action === 'start' && current === PlannerStates.Approved && role === 'educator') return true;
  if (action === 'sendForSignoff' && current === PlannerStates.InProgress && role === 'educator') return true;
  if (action === 'signoff' && current === PlannerStates.SentForSignoff && role === 'supervisor') return true;
  if (action === 'reject' && (current === PlannerStates.Submitted || current === PlannerStates.SentForSignoff) && role === 'supervisor') return true;
  return false;
}

export function transitionPayload(action, user) {
  const now = new Date().toISOString();
  switch(action) {
    case 'submit': return { Status: PlannerStates.Submitted, submittedAt: now, submittedBy: user?.displayName || user?.upn };
    case 'approve': return { Status: PlannerStates.Approved, approvedAt: now, approvedBy: user?.displayName || user?.upn };
    case 'start': return { Status: PlannerStates.InProgress, startedAt: now, startedBy: user?.displayName || user?.upn };
    case 'sendForSignoff': return { Status: PlannerStates.SentForSignoff, signoffRequestedAt: now, signoffRequestedBy: user?.displayName || user?.upn };
    case 'signoff': return { Status: PlannerStates.SignedOff, signedOffAt: now, signedOffBy: user?.displayName || user?.upn };
    case 'reject': return { Status: PlannerStates.Rejected, rejectedAt: now, rejectedBy: user?.displayName || user?.upn };
    default: return {};
  }
}
