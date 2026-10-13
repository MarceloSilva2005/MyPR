import type { Metadata } from "next";

import { authContent } from "@/content/auth";
import { AuthHeader } from "@/features/auth/auth-header";
import { SignUpForm } from "@/features/auth/forms";

export const metadata: Metadata = { title: authContent.signUp.title };

export default function SignUpPage() {
  return (
    <>
      <AuthHeader title={authContent.signUp.title} description={authContent.signUp.description} />
      <SignUpForm />
    </>
  );
}
