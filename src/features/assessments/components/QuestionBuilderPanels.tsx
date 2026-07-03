import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import type { QuestionAIDraftProgressEvent } from "../types/QuestionBank";
import { languageDisplayName } from "../utils/questionLanguage";

type AgentRunScope =
  | "full"
  | "basics"
  | "problem"
  | "problem_field"
  | "constraints"
  | "constraints_formats"
  | "examples"
  | "tests"
  | "tests_solution"
  | "solution"
  | "other_languages"
  | "recruiter_validation"
  | "difficulty"
  | "metadata"
  | "validation";

interface QuestionBuilderStep {
  id: number;
  title: string;
  actionLabel: string;
}

export function AgentRunOverlay({
  scope,
  commentary,
  lines,
  progressEvents,
  latestEvent,
}: {
  scope: AgentRunScope;
  commentary: string;
  lines: string[];
  progressEvents: QuestionAIDraftProgressEvent[];
  latestEvent: QuestionAIDraftProgressEvent | null;
}) {
  const title =
    scope === "full"
      ? "Generating full question draft"
      : scope === "validation"
        ? "Running execution validation"
        : "Generating section";
  const showLiveProgress = Boolean(latestEvent);
  const liveUpdates = progressEvents
    .filter(
      (event) =>
        event.type !== "validation_case_start" && event.type !== "validation_case_result",
    )
    .slice(-5);
  const liveCommentary = latestEvent?.message || commentary;
  const progressValue = latestEvent?.progress ?? null;
  const latestValidationPass = progressEvents.reduce(
    (latest, event) => Math.max(latest, event.validation_pass || 0),
    0,
  );
  const validationCaseMap = new Map<string, QuestionAIDraftProgressEvent>();
  progressEvents.forEach((event) => {
    if (
      event.validation_pass !== latestValidationPass ||
      !event.test_bucket ||
      !event.test_index ||
      !event.test_outcome
    ) {
      return;
    }
    validationCaseMap.set(`${event.test_bucket}-${event.test_index}`, event);
  });
  const validationCases = Array.from(validationCaseMap.values()).sort((left, right) => {
    const leftBucket = left.test_bucket === "sample" ? 0 : 1;
    const rightBucket = right.test_bucket === "sample" ? 0 : 1;
    return leftBucket - rightBucket || (left.test_index || 0) - (right.test_index || 0);
  });
  const completedValidationCases = validationCases.filter(
    (event) => event.test_outcome !== "running",
  ).length;

  return (
    <div className="agent-run-backdrop" role="status" aria-live="polite">
      <Card className="agent-run-modal">
        <div className="agent-run-head">
          <div className="agent-orb" aria-hidden="true" />
          <div>
            <span>{scope === "validation" ? "Validation" : "Generation"}</span>
            <h2>{title}</h2>
            <p>{liveCommentary}</p>
          </div>
        </div>
        {showLiveProgress && progressValue !== null ? (
          <div className="agent-run-progress" aria-live="polite">
            <div className="agent-run-progress-head">
              <div>
                <span>Live progress</span>
                <strong>{latestEvent?.next_node || latestEvent?.current_node || "working"}</strong>
              </div>
              <em>{progressValue}%</em>
            </div>
            <div
              className="agent-run-progress-track"
              role="progressbar"
              aria-label="AI generation progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progressValue}
            >
              <span style={{ width: `${progressValue}%` }} />
            </div>
          </div>
        ) : null}
        {validationCases.length > 0 ? (
          <section className="agent-test-progress" aria-label="Live test case validation">
            <div className="agent-test-progress-head">
              <div>
                <span>Test execution</span>
                <strong>
                  {completedValidationCases} of {latestEvent?.overall_total || validationCases.length} checked
                </strong>
              </div>
              <em>Pass {latestValidationPass}</em>
            </div>
            <div className="agent-test-case-list">
              {validationCases.map((event) => {
                const outcome = event.test_outcome || "running";
                const statusLabel =
                  outcome === "passed"
                    ? "Passed"
                    : outcome === "wrong"
                      ? "Wrong answer"
                      : outcome === "error"
                        ? "Error"
                        : "Running";
                const compactValue = (value: string | undefined, fallback: string) => {
                  const compacted = (value || fallback).replace(/\s+/g, " ").trim();
                  return compacted.length > 120
                    ? `${compacted.slice(0, 117)}...`
                    : compacted;
                };
                const inputPreview = compactValue(event.test_input, "No standard input");
                const expectedPreview = compactValue(event.expected_output, "(empty)");
                const actualPreview =
                  outcome === "running"
                    ? "Waiting for program output"
                    : compactValue(event.actual_output, "(empty)");
                return (
                  <article
                    key={`${latestValidationPass}-${event.test_bucket}-${event.test_index}`}
                    className={`agent-test-case is-${outcome}`}
                  >
                    <div className="agent-test-case-title">
                      <span aria-hidden="true" />
                      <strong>
                        {event.test_bucket === "sample" ? "Sample" : "Hidden"} {event.test_index}
                      </strong>
                      {event.test_language ? <b>{languageDisplayName(event.test_language)}</b> : null}
                      <em>{statusLabel}</em>
                    </div>
                    <div className="agent-test-io-grid">
                      <div>
                        <span>Input</span>
                        <code title={event.test_input || ""}>{inputPreview}</code>
                      </div>
                      <div>
                        <span>Expected</span>
                        <code title={event.expected_output || ""}>{expectedPreview}</code>
                      </div>
                      <div>
                        <span>Actual</span>
                        <code title={event.actual_output || ""}>{actualPreview}</code>
                      </div>
                    </div>
                    {outcome === "error" && event.error_message ? (
                      <p>{event.error_message}</p>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}
        {showLiveProgress ? (
          <div className="agent-thinking-list">
            {liveUpdates.map((event, index) => (
              <div
                key={`${event.type}-${event.current_node || "start"}-${index}`}
                className={[
                  "agent-thinking-line",
                  index === liveUpdates.length - 1 ? "is-active" : "is-complete",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <span aria-hidden="true" />
                <p>{event.message}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="agent-thinking-list">
            {lines.map((line, index) => (
              <div
                key={line}
                className={index === 0 ? "agent-thinking-line is-active" : "agent-thinking-line"}
              >
                <span aria-hidden="true" />
                <p>
                  {line}
                  <b className="thinking-dots" aria-hidden="true" />
                </p>
              </div>
            ))}
          </div>
        )}
        <p className="agent-run-foot">
          Keep this page open. This popup now tracks the live agent updates, and
          the builder will apply the accepted fields automatically when the run finishes.
        </p>
      </Card>
    </div>
  );
}

export function StepCard({
  step,
  active,
  visualState = "untouched",
  busy = false,
  completed = false,
  onToggle,
  onGenerate,
  children,
}: {
  step: QuestionBuilderStep;
  active: boolean;
  visualState?: "untouched" | "in-progress" | "complete";
  busy?: boolean;
  completed?: boolean;
  onToggle: () => void;
  onGenerate?: () => void;
  children: ReactNode;
}) {
  return (
    <Card
      className={[
        "step-card",
        active ? "is-active" : "",
        completed ? "is-complete" : "",
        `is-${visualState}`,
        busy ? "is-loading" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="step-card-header">
        <button type="button" className="step-card-toggle" onClick={onToggle}>
          <div>
            <p>
              {busy
                ? "Agent loading"
                : visualState === "complete"
                  ? "Section complete"
                  : visualState === "untouched"
                    ? "Not visited"
                    : `Step ${step.id} in progress`}
            </p>
            <h3>{step.title}</h3>
          </div>
        </button>
        {onGenerate ? (
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={(event) => {
              event.stopPropagation();
              onGenerate();
            }}
          >
            <Sparkles size={16} />
            {busy ? "Working..." : step.actionLabel}
          </Button>
        ) : null}
      </div>
      {active ? (
        <div className="step-card-body">
          {children}
        </div>
      ) : null}
    </Card>
  );
}


