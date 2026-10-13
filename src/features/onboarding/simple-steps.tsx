import { completeOnboarding, goBack, skipTrainingProfile, startOnboarding } from "./actions";
import { onboardingContent } from "@/content/onboarding";
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

export function DoneStep() {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-fg-muted">{copy.done.body}</p>
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
