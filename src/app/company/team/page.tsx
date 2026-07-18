'use client';

import { useState, useEffect } from 'react';
import { Plus, Loader2, Users, MoreVertical, CheckCircle2, Clock, XCircle, Shield, AlertCircle } from 'lucide-react';

type CompanyRole = 'owner' | 'administrator' | 'editor' | 'marketing_manager' | 'support_agent' | 'analytics_viewer';

const ROLE_LABELS: Record<CompanyRole, string> = {
  owner: 'Owner', administrator: 'Administrator', editor: 'Editor',
  marketing_manager: 'Marketing Manager', support_agent: 'Support Agent', analytics_viewer: 'Analytics Viewer',
};

const ROLE_COLORS: Record<CompanyRole, string> = {
  owner: 'bg-primary-100 text-primary-700', administrator: 'bg-blue-100 text-blue-700',
  editor: 'bg-green-100 text-green-700', marketing_manager: 'bg-purple-100 text-purple-700',
  support_agent: 'bg-amber-100 text-amber-700', analytics_viewer: 'bg-secondary-100 text-secondary-600',
};

interface Member {
  id: string; user_id: string; role: CompanyRole; status: string;
  invited_at: string; accepted_at: string | null;
  name: string | null; email: string | null; image: string | null;
}

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'editor' as CompanyRole });
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  useEffect(() => {
    loadMembers();
  }, []);

  async function loadMembers() {
    try {
      const res = await fetch('/api/company/team');
      if (res.ok) {
        const { members } = await res.json();
        setMembers(members);
      }
    } finally {
      setLoading(false);
    }
  }

  async function invite() {
    if (!inviteForm.email) return;
    setInviting(true);
    setInviteError('');
    try {
      const res = await fetch('/api/company/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteForm),
      });
      if (res.ok) {
        setShowInvite(false);
        setInviteForm({ email: '', role: 'editor' });
        loadMembers();
      } else {
        const d = await res.json();
        setInviteError(d.error || 'Failed to invite');
      }
    } finally {
      setInviting(false);
    }
  }

  async function updateMember(memberId: string, action: string, role?: CompanyRole) {
    await fetch('/api/company/team', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, action, role }),
    });
    setOpenMenu(null);
    loadMembers();
  }

  const activeMembers = members.filter(m => m.status === 'active');
  const pendingMembers = members.filter(m => m.status === 'pending');

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Team Management</h1>
          <p className="text-sm text-secondary-500 mt-0.5">Manage who has access to your company portal</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Invite Member
        </button>
      </div>

      {/* Invite Form */}
      {showInvite && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-5 mb-6">
          <h3 className="font-semibold text-secondary-900 mb-4">Invite Team Member</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1.5">Email Address</label>
              <input
                type="email"
                value={inviteForm.email}
                onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
                placeholder="colleague@company.com"
                className="w-full text-sm border border-secondary-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1.5">Role</label>
              <select
                value={inviteForm.role}
                onChange={e => setInviteForm(f => ({ ...f, role: e.target.value as CompanyRole }))}
                className="w-full text-sm border border-secondary-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-primary-500"
              >
                {Object.entries(ROLE_LABELS).filter(([r]) => r !== 'owner').map(([r, label]) => (
                  <option key={r} value={r}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          {inviteError && (
            <div className="flex items-center gap-2 text-sm text-red-600 mb-3">
              <AlertCircle className="h-4 w-4" />
              {inviteError}
            </div>
          )}
          <div className="bg-white rounded-lg border border-secondary-200 p-3 mb-4">
            <h4 className="text-xs font-semibold text-secondary-700 mb-2 uppercase tracking-wide">Role Permissions</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-secondary-500">
              <span>Owner: Full access + billing</span>
              <span>Admin: Full access (no billing)</span>
              <span>Editor: Edit tools + media</span>
              <span>Marketing: Campaigns + leads</span>
              <span>Support: View reviews + leads</span>
              <span>Viewer: Analytics only</span>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowInvite(false)} className="px-4 py-2 text-sm text-secondary-600 border border-secondary-200 rounded-lg hover:bg-secondary-50">
              Cancel
            </button>
            <button
              onClick={invite}
              disabled={inviting || !inviteForm.email}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50"
            >
              {inviting && <Loader2 className="h-4 w-4 animate-spin" />}
              Send Invitation
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary-500" /></div>
      ) : (
        <div className="space-y-6">
          {/* Active Members */}
          <div>
            <h2 className="text-sm font-semibold text-secondary-500 uppercase tracking-wider mb-3">
              Active Members ({activeMembers.length})
            </h2>
            {activeMembers.length === 0 ? (
              <div className="bg-white rounded-xl border border-secondary-200 p-8 text-center">
                <Users className="h-8 w-8 text-secondary-300 mx-auto mb-2" />
                <p className="text-sm text-secondary-400">No active members yet.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-secondary-200 divide-y divide-secondary-100">
                {activeMembers.map(member => (
                  <div key={member.id} className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-semibold text-sm flex-shrink-0">
                      {member.image
                        ? <img src={member.image} alt={member.name || ''} className="h-full w-full rounded-full object-cover" />
                        : (member.name?.charAt(0) || member.email?.charAt(0) || '?').toUpperCase()
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-secondary-900 text-sm truncate">{member.name || 'Unnamed User'}</p>
                      <p className="text-xs text-secondary-400 truncate">{member.email}</p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_COLORS[member.role]}`}>
                      {ROLE_LABELS[member.role]}
                    </span>
                    {member.role !== 'owner' && (
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenu(openMenu === member.id ? null : member.id)}
                          className="p-1.5 rounded-lg hover:bg-secondary-100 text-secondary-400"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {openMenu === member.id && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg border border-secondary-200 shadow-lg z-10 py-1">
                            {Object.entries(ROLE_LABELS)
                              .filter(([r]) => r !== 'owner' && r !== member.role)
                              .map(([r, label]) => (
                                <button
                                  key={r}
                                  onClick={() => updateMember(member.id, 'change_role', r as CompanyRole)}
                                  className="w-full text-left px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50"
                                >
                                  Change to {label}
                                </button>
                              ))}
                            <hr className="my-1 border-secondary-100" />
                            <button
                              onClick={() => updateMember(member.id, 'revoke')}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              Remove access
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Invitations */}
          {pendingMembers.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-secondary-500 uppercase tracking-wider mb-3">
                Pending Invitations ({pendingMembers.length})
              </h2>
              <div className="bg-white rounded-xl border border-secondary-200 divide-y divide-secondary-100">
                {pendingMembers.map(member => (
                  <div key={member.id} className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-100 text-secondary-400 flex-shrink-0">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-secondary-900 text-sm truncate">{member.email}</p>
                      <p className="text-xs text-secondary-400">
                        Invited {new Date(member.invited_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_COLORS[member.role]}`}>
                      {ROLE_LABELS[member.role]}
                    </span>
                    <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      Pending
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
