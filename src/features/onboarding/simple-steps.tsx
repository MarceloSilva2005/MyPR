import { completeOnboarding, goBack, skipTrainingProfile, startOnboarding } from "./actions";
import { onboardingContent } from "@/content/onboarding";
import type { Profile } from "@/data/profiles";
import { Button } from "@/ds/button";

const copy = onboardingContent;

/** Secondary actions sit under the main button, each in its own form. */
export function SecondaryActions({
  back = true,
  skip = false,
}: {
  back?: boolean;
  skip?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      {back ? (
        <form action={goBack}>
          <Button type="submit" variant="ghost">
            {copy.back}
          </Button>
        </form>
      ) : (
        <span />
      )}
      {skip ? (
        <form action={skipTrainingProfile}>
          <Button type="submit" variant="ghost">
            {copy.trainingProfile.skip}
          </Button>
        </form>
      ) : null}
    </div>
  );
}

export function WelcomeStep() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 text-sm text-fg-muted">
        {copy.welcome.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <form action={startOnboarding}>
        <Button type="submit" variant="primary" className="w-full">
          {copy.welcome.start}
        </Button>
      </form>
    </div>
  );
}

/** Shows what the answers set, so no default is applied silently. */
export function DoneStep({ profile }: { profile: Profile }) {
  const done = copy.done;
  const unit = profile.weight_unit === "lb" ? "lb" : "kg";
  const rows = [
    [done.unit, copy.preferences.weightUnits[unit]],
    [done.weekStart, done.weekDays[String(profile.week_starts_on)] ?? ""],
    [done.rest, done.restValue(profile.default_rest_seconds)],
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-fg-muted">{done.body}</p>
      <section aria-labelledby="onboarding-summary" className="flex flex-col gap-2">
        <h2 id="onboarding-summary" className="text-sm font-medium text-fg">
          {done.summary}
        </h2>
        <dl className="divide-y divide-line rounded-lg border border-line text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-4 px-3 py-2">
              <dt className="text-fg-muted">{label}</dt>
              <dd className="text-fg">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="text-xs text-fg-muted">{done.editHint}</p>
      </section>
      <div className="flex flex-col gap-2">
        <form action={completeOnboarding}>
          <input type="hidden" name="destination" value="/app/routines" />
          <Button type="submit" variant="primary" className="w-full">
            {copy.done.buildRoutine}
          </Button>
        </form>
        <form action={completeOnboarding}>
          <input type="hidden" name="destination" value="/app/workout" />
          <Button type="submit" variant="secondary" className="w-full">
            {copy.done.startWorkout}
          </Button>
        </form>
      </div>
      <SecondaryActions />
    </div>
  );
}
