import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { AssessmentSlot, SlotCandidate } from "../types/Assessment";
import { CandidatesTab } from "./CandidateManagementPanels";

const slot: AssessmentSlot = {
  id: "slot-1",
  assessment_id: "assessment-1",
  recruiter_uid: "recruiter-1",
  title: "Morning batch",
  instructions_override: "",
  start_at: "2026-07-03T04:30:00Z",
  end_at: "2026-07-03T05:30:00Z",
  duration_minutes: 60,
  timezone_name: "Asia/Kolkata",
  timezone_offset_minutes: 330,
  status: "scheduled",
  effective_status: "scheduled",
  seconds_until_start: 3_600,
  accepting_closes_in_seconds: 7_200,
  is_accepting_responses: false,
  paused_at: null,
  total_paused_seconds: 0,
  candidate_count: 1,
  submitted_count: 0,
  created_at: "2026-07-02T10:00:00Z",
  updated_at: "2026-07-02T10:00:00Z",
};

const candidates: SlotCandidate[] = [
  {
    candidate_assessment_id: "candidate-assessment-1",
    candidate_id: "candidate-1",
    name: "Asha Rao",
    email: "asha@example.com",
    external_id: "EMP-1",
    invite_status: "sent",
    assessment_status: "not_started",
    hidden_checks_used: 0,
    started_at: null,
    submitted_at: null,
    last_activity_at: null,
    total_score: null,
    percentage: null,
    rank: null,
  },
];

function renderCandidates() {
  const onImport = vi.fn();
  const onSendInvites = vi.fn();
  const onResend = vi.fn();
  render(
    <CandidatesTab
      slot={slot}
      candidateCsv="name,email,external_id\n"
      candidates={candidates}
      importPending={false}
      invitePending={false}
      importErrors={[]}
      importError=""
      inviteError=""
      resendPendingId={null}
      onCsvChange={vi.fn()}
      onImport={onImport}
      onSendInvites={onSendInvites}
      onResend={onResend}
    />,
  );
  return { onImport, onSendInvites, onResend };
}

describe("CandidatesTab", () => {
  it("dispatches invites to all candidates or only selected rows", () => {
    const { onSendInvites, onResend } = renderCandidates();

    fireEvent.click(screen.getByRole("button", { name: "Send invites" }));
    expect(onSendInvites).toHaveBeenLastCalledWith();

    fireEvent.click(screen.getByLabelText("Select Asha Rao"));
    fireEvent.click(screen.getByRole("button", { name: "Send selected (1)" }));
    expect(onSendInvites).toHaveBeenLastCalledWith(["candidate-assessment-1"]);

    const row = screen.getByText("Asha Rao").closest("tr");
    expect(row).not.toBeNull();
    fireEvent.click(within(row!).getByRole("button", { name: "Resend" }));
    expect(onResend).toHaveBeenCalledWith("candidate-assessment-1");
  });

  it("converts a manual candidate into the CSV import contract", () => {
    const { onImport } = renderCandidates();

    fireEvent.click(screen.getByRole("button", { name: "Add Candidate" }));
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Asha Rao" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "asha@example.com" },
    });
    fireEvent.change(screen.getByLabelText("External ID"), {
      target: { value: "EMP-1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Import Candidate" }));

    expect(onImport).toHaveBeenCalledWith(
      "name,email,external_id\nAsha Rao,asha@example.com,EMP-1",
    );
  });
});
