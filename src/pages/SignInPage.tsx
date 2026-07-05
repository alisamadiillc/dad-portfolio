import { SignIn } from "@clerk/react";

function SignInPage() {
  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <SignIn
        forceRedirectUrl="/admin"
        appearance={{ elements: { footerAction: { display: "none" } } }}
      />
    </div>
  );
}

export default SignInPage;
