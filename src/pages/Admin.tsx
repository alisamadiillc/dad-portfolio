import { UserButton } from "@clerk/react";

function Admin() {
  return (
    <div className="min-h-svh">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <h1 className="text-lg font-semibold">Admin</h1>
        <UserButton />
      </header>
      <main className="p-6">
        <p className="text-muted-foreground">
          Signed in. This area is only visible to authenticated users.
        </p>
      </main>
    </div>
  );
}

export default Admin;
