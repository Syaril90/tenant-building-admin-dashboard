export type ImportFeedback = {
  tone: "error" | "success";
  message: string;
  details?: string[];
};

export function ImportFeedbackBanner({
  feedback
}: {
  feedback: ImportFeedback | null;
}) {
  if (!feedback) {
    return null;
  }

  return (
    <div
      className={`rounded-lg border p-4 text-sm ${
        feedback.tone === "error"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-emerald-200 bg-emerald-50 text-success-700"
      }`}
    >
      <p>{feedback.message}</p>
      {feedback.details?.length ? (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-xs">
          {feedback.details.slice(0, 8).map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
