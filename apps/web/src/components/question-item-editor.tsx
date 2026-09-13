import { BloomTag, Difficulty } from "@prisma/client";
import { deleteQuestion, regenerateQuestion, updateQuestion } from "@/app/(tutor)/quizzes/actions";
import { SubmitButton } from "@/components/submit-button";
import { asStringArray, bloomTags, difficulties } from "@/lib/options";

export function QuestionItemEditor({
  question,
  index,
  frozen,
}: {
  question: {
    id: string;
    stem: string;
    options: unknown;
    correctIndex: number;
    explanation: string;
    sourceExcerpt: string;
    difficulty: Difficulty;
    bloomTag: BloomTag;
  };
  index: number;
  frozen: boolean;
}) {
  const options = asStringArray(question.options);
  while (options.length < 4) options.push("");

  return (
    <article className="paper-card space-y-3 p-5">
      <p className="text-xs uppercase tracking-wide text-ink/50">Question {index + 1}</p>
      <form action={updateQuestion} className="space-y-3">
        <input type="hidden" name="questionId" value={question.id} />
        <label className="block text-sm">
          Stem
          <textarea
            name="stem"
            required
            rows={3}
            defaultValue={question.stem}
            readOnly={frozen}
            className="mt-1 w-full rounded-xl border border-line px-3 py-2"
          />
        </label>
        {options.slice(0, 4).map((option, optionIndex) => (
          <label key={optionIndex} className="block text-sm">
            Option {String.fromCharCode(65 + optionIndex)}
            <input
              name={`option_${optionIndex}`}
              required
              defaultValue={option}
              readOnly={frozen}
              className="mt-1 w-full rounded-xl border border-line px-3 py-2"
            />
          </label>
        ))}
        <label className="block text-sm">
          Correct answer
          <select
            name="correctIndex"
            defaultValue={question.correctIndex}
            disabled={frozen}
            className="mt-1 w-full rounded-xl border border-line px-3 py-2"
          >
            <option value={0}>A</option>
            <option value={1}>B</option>
            <option value={2}>C</option>
            <option value={3}>D</option>
          </select>
        </label>
        <label className="block text-sm">
          Explanation
          <textarea
            name="explanation"
            required
            rows={2}
            defaultValue={question.explanation}
            readOnly={frozen}
            className="mt-1 w-full rounded-xl border border-line px-3 py-2"
          />
        </label>
        <details className="rounded-xl border border-line px-3 py-2 text-sm">
          <summary className="cursor-pointer text-ink/70">Difficulty, Bloom tag, source excerpt</summary>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="block">
              Difficulty
              <select
                name="difficulty"
                defaultValue={question.difficulty}
                disabled={frozen}
                className="mt-1 w-full rounded-xl border border-line px-3 py-2"
              >
                {difficulties.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              Bloom tag
              <select
                name="bloomTag"
                defaultValue={question.bloomTag}
                disabled={frozen}
                className="mt-1 w-full rounded-xl border border-line px-3 py-2"
              >
                {bloomTags.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="mt-3 block">
            Source excerpt
            <textarea
              name="sourceExcerpt"
              required
              rows={2}
              defaultValue={question.sourceExcerpt}
              readOnly={frozen}
              className="mt-1 w-full rounded-xl border border-line px-3 py-2"
            />
          </label>
        </details>
        {frozen ? null : (
          <SubmitButton className="rounded-full bg-ink px-3 py-1.5 text-sm text-paper">Save question</SubmitButton>
        )}
      </form>
      {frozen ? null : (
        <div className="flex flex-wrap gap-2">
          <form action={regenerateQuestion}>
            <input type="hidden" name="questionId" value={question.id} />
            <SubmitButton
              pendingLabel="Creating a new question…"
              className="rounded-full border border-line px-3 py-1.5 text-sm"
            >
              Regenerate this question
            </SubmitButton>
          </form>
          <form action={deleteQuestion}>
            <input type="hidden" name="questionId" value={question.id} />
            <SubmitButton className="rounded-full border border-line px-3 py-1.5 text-sm text-clay">
              Remove question
            </SubmitButton>
          </form>
        </div>
      )}
    </article>
  );
}
