import { useEffect, useMemo, useState } from "react";

import { DashboardModal } from "../components/dashboard-modal";
import { DashboardPanel } from "../components/dashboard-panel";
import { DashboardStatCard } from "../components/dashboard-stat-card";
import type {
  AdminAccess,
  AdminAccessUser,
  AdminAccessUserStatus,
  DashboardPageSection,
} from "../types";

type AccessRouteProps = {
  isLoading: boolean;
  accessAdmin?: AdminAccess;
  sections: DashboardPageSection[];
};

const statusToneClass: Record<AdminAccessUserStatus, string> = {
  active: "bg-emerald-50 text-success-700",
  invited: "bg-amber-50 text-warning-700",
  suspended: "bg-rose-50 text-rose-700",
};

export function AccessRoute({
  isLoading,
  accessAdmin,
  sections: _sections,
}: AccessRouteProps) {
  const users = accessAdmin?.users ?? [];
  const roles = accessAdmin?.roles ?? [];
  const auditEntries = accessAdmin?.auditEntries ?? [];
  const securityControls = accessAdmin?.securityControls ?? [];
  const [statusFilter, setStatusFilter] = useState<"all" | AdminAccessUserStatus>("all");
  const [searchValue, setSearchValue] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    const query = searchValue.trim().toLowerCase();

    return users.filter((user) => {
      const matchesStatus = statusFilter === "all" ? true : user.status === statusFilter;
      const matchesSearch =
        query.length === 0
          ? true
          : [
              user.fullName,
              user.email,
              user.roleLabel,
              user.assignedBuildings.join(" "),
            ]
              .join(" ")
              .toLowerCase()
              .includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [searchValue, statusFilter, users]);

  useEffect(() => {
    if (selectedUserId && !filteredUsers.some((user) => user.id === selectedUserId)) {
      setSelectedUserId(null);
    }
  }, [filteredUsers, selectedUserId]);

  const selectedUser = selectedUserId
    ? filteredUsers.find((user) => user.id === selectedUserId) ?? null
    : null;
  const selectedRole = selectedUser
    ? roles.find((role) => role.id === selectedUser.roleId) ?? null
    : null;

  const stats = useMemo(
    () => ({
      active: users.filter((user) => user.status === "active").length,
      invited: users.filter((user) => user.status === "invited").length,
      mfaCoverage: users.filter((user) => user.mfaEnabled).length,
      roles: roles.length,
    }),
    [roles.length, users],
  );

  return (
    <>
      <section className="grid gap-4 md:grid-cols-4">
        <DashboardStatCard
          label="Active Admins"
          value={stats.active}
          tone="success"
          hint="Accounts currently able to enter the building-admin console."
        />
        <DashboardStatCard
          label="Pending Invites"
          value={stats.invited}
          tone="warning"
          hint="Invited staff who still need to accept access and complete setup."
        />
        <DashboardStatCard
          label="MFA Enabled"
          value={stats.mfaCoverage}
          tone="brand"
          hint="Admin accounts already protected by multi-factor authentication."
        />
        <DashboardStatCard
          label="Access Roles"
          value={stats.roles}
          tone="neutral"
          hint="Predefined role sets currently used to scope module permissions."
        />
      </section>

      {selectedUser ? (
        <DashboardModal
          title={accessAdmin?.helperTitle ?? "Admin Access Detail"}
          description={
            accessAdmin?.helperDescription ??
            "Review the assigned role, access state, and security controls before changing privileges."
          }
          onClose={() => setSelectedUserId(null)}
        >
          <AccessUserDetail user={selectedUser} role={selectedRole} />
        </DashboardModal>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <DashboardPanel
          title={accessAdmin?.title ?? "Admin Users & Access Control"}
          description={accessAdmin?.description ?? ""}
        >
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search admin, email, role, or building assignment"
                className="min-w-[240px] flex-1 rounded-pill border border-border-100 bg-white px-4 py-2 text-sm text-ink-700 outline-none transition focus:border-brand-900"
              />
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as "all" | AdminAccessUserStatus)
                }
                className="rounded-pill border border-border-100 bg-white px-4 py-2 text-sm text-ink-700"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="invited">Invited</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            {!isLoading ? (
              <p className="text-xs uppercase tracking-[0.16em] text-ink-500">
                Showing {filteredUsers.length} of {users.length} admin accounts
              </p>
            ) : null}

            <div className="space-y-3">
              {isLoading
                ? Array.from({ length: 4 }).map((_, index) => (
                    <AccessQueueSkeleton key={index} />
                  ))
                : filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => setSelectedUserId(user.id)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        user.id === selectedUserId
                          ? "border-brand-900 bg-brand-100/40 shadow-card"
                          : "border-border-100 bg-white hover:border-brand-900/25 hover:bg-canvas-50"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-brand-900">{user.fullName}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-ink-500">
                            {user.roleLabel} • {user.email}
                          </p>
                        </div>
                        <span
                          className={`rounded-pill px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${statusToneClass[user.status]}`}
                        >
                          {user.status}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-ink-500">
                        {user.assignedBuildings.join(" • ")}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-pill bg-canvas-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-700">
                          {user.mfaEnabled ? "MFA enabled" : "MFA pending"}
                        </span>
                        <span className="rounded-pill bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-500 ring-1 ring-border-100">
                          {user.lastActive}
                        </span>
                      </div>
                    </button>
                  ))}
            </div>
          </div>
        </DashboardPanel>

        <div className="space-y-6">
          <DashboardPanel
            title="Roles & Permissions"
            description="Use clear scoped roles instead of granting full access by default."
          >
            <div className="space-y-3">
              {isLoading
                ? Array.from({ length: 3 }).map((_, index) => (
                    <AccessCardSkeleton key={index} />
                  ))
                : roles.map((role) => (
                    <div
                      key={role.id}
                      className="rounded-2xl border border-border-100 bg-canvas-50 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-bold text-brand-900">{role.name}</p>
                        <span className="rounded-pill bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-700 ring-1 ring-border-100">
                          {role.scope}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-ink-500">
                        {role.description}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {role.modules.slice(0, 4).map((module) => (
                          <span
                            key={module}
                            className="rounded-pill border border-border-100 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-700"
                          >
                            {module}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
            </div>
          </DashboardPanel>

          <DashboardPanel
            title="Security Controls"
            description="Critical access and finance actions should stay behind strong guardrails."
          >
            <div className="space-y-3">
              {isLoading
                ? Array.from({ length: 3 }).map((_, index) => (
                    <AccessCardSkeleton key={index} />
                  ))
                : securityControls.map((control) => (
                    <div
                      key={control.id}
                      className="rounded-2xl border border-border-100 bg-white p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-bold text-brand-900">{control.title}</p>
                        <span className="rounded-pill bg-brand-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-900">
                          Live
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-ink-500">
                        {control.description}
                      </p>
                      <p className="mt-3 text-xs uppercase tracking-[0.16em] text-ink-500">
                        {control.meta}
                      </p>
                    </div>
                  ))}
            </div>
          </DashboardPanel>
        </div>
      </section>

      <section>
        <DashboardPanel
          title="Recent Access Log"
          description="Keep role changes, invites, and sign-ins visible for management review."
        >
          <div className="space-y-3">
            {isLoading
              ? Array.from({ length: 3 }).map((_, index) => (
                  <AccessCardSkeleton key={index} />
                ))
              : auditEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-2xl border border-border-100 bg-white p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-pill px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                          entry.tone === "warning"
                            ? "bg-amber-50 text-warning-700"
                            : entry.tone === "success"
                              ? "bg-emerald-50 text-success-700"
                              : "bg-brand-100 text-brand-900"
                        }`}
                      >
                        Access Event
                      </span>
                      <span className="text-xs uppercase tracking-[0.16em] text-ink-500">
                        {entry.meta}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-brand-900">
                      {entry.title}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-ink-500">
                      {entry.description}
                    </p>
                  </div>
                ))}
          </div>
        </DashboardPanel>
      </section>
    </>
  );
}

function AccessUserDetail({
  user,
  role,
}: {
  user: AdminAccessUser;
  role: AdminAccess["roles"][number] | null;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-ink-500">Admin User</p>
          <h3 className="mt-2 text-2xl font-black tracking-[-0.03em] text-brand-900">
            {user.fullName}
          </h3>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            {user.roleLabel} • {user.email}
          </p>
        </div>
        <span
          className={`rounded-pill px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${statusToneClass[user.status]}`}
        >
          {user.status}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <AccessDetailBlock label="Phone" value={user.phone} />
        <AccessDetailBlock label="Last Active" value={user.lastActive} />
        <AccessDetailBlock
          label="MFA Status"
          value={user.mfaEnabled ? "Enabled" : "Pending setup"}
        />
        <AccessDetailBlock label="Invite State" value={user.inviteStateLabel} />
      </div>

      <div className="rounded-2xl border border-border-100 bg-canvas-50 p-4">
        <p className="text-xs uppercase tracking-[0.16em] text-ink-500">Assigned Areas</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {user.assignedBuildings.map((item) => (
            <span
              key={item}
              className="rounded-pill border border-border-100 bg-white px-3 py-1 text-xs font-semibold text-ink-700"
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      {role ? (
        <>
          <div className="rounded-2xl border border-border-100 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-ink-500">Role Scope</p>
            <p className="mt-2 text-sm font-semibold text-brand-900">{role.name}</p>
            <p className="mt-2 text-sm leading-6 text-ink-500">{role.description}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border-100 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-ink-500">Modules</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {role.modules.map((module) => (
                  <span
                    key={module}
                    className="rounded-pill border border-border-100 bg-canvas-50 px-3 py-1 text-xs font-semibold text-ink-700"
                  >
                    {module}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-border-100 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-ink-500">
                Permissions
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {role.permissions.map((permission) => (
                  <span
                    key={permission}
                    className="rounded-pill border border-border-100 bg-canvas-50 px-3 py-1 text-xs font-semibold text-ink-700"
                  >
                    {permission}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function AccessDetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border-100 bg-white p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-ink-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-brand-900">{value}</p>
    </div>
  );
}

function AccessQueueSkeleton() {
  return (
    <div className="rounded-2xl border border-border-100 bg-white p-4">
      <div className="h-5 w-40 animate-pulse rounded-full bg-surface-100" />
      <div className="mt-2 h-4 w-48 animate-pulse rounded-full bg-surface-100" />
      <div className="mt-3 h-4 w-4/5 animate-pulse rounded-full bg-surface-100" />
    </div>
  );
}

function AccessCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border-100 bg-white p-4">
      <div className="h-5 w-36 animate-pulse rounded-full bg-surface-100" />
      <div className="mt-3 h-4 w-full animate-pulse rounded-full bg-surface-100" />
      <div className="mt-2 h-4 w-4/5 animate-pulse rounded-full bg-surface-100" />
    </div>
  );
}
