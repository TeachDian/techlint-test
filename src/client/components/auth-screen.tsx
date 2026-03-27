import { useState } from "react";
import { ApiError } from "@client/lib/api";
import { Button } from "@client/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@client/components/ui/card";
import { Field, FieldLabel, FieldMessage } from "@client/components/ui/field";
import { Input } from "@client/components/ui/input";
import { useAuth } from "@client/contexts/AuthContext";

export function AuthScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    setFieldErrors({});

    try {
      if (mode === "register") {
        await register({ name, email, password });
        return;
      }

      await login({ email, password });
    } catch (error) {
      if (error instanceof ApiError) {
        setMessage(error.message);
        setFieldErrors(error.fieldErrors ?? {});
      } else {
        setMessage("Something went wrong. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-md shadow-board">
        <CardHeader className="space-y-4 border-b">
          <div className="inline-flex items-center gap-1 border bg-muted p-1">
            <Button onClick={() => setMode("register")} variant={mode === "register" ? "default" : "ghost"}>
              Register
            </Button>
            <Button onClick={() => setMode("login")} variant={mode === "login" ? "default" : "ghost"}>
              Login
            </Button>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl">{mode === "register" ? "Create account" : "Sign in"}</CardTitle>
            <p className="text-sm text-muted-foreground">Use one account per private board.</p>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {mode === "register" ? (
              <Field>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input id="name" placeholder="Jane Doe" value={name} onChange={(event) => setName(event.target.value)} />
                {fieldErrors.name ? <FieldMessage>{fieldErrors.name}</FieldMessage> : null}
              </Field>
            ) : null}

            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input id="email" placeholder="you@example.com" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
              {fieldErrors.email ? <FieldMessage>{fieldErrors.email}</FieldMessage> : null}
            </Field>

            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input id="password" placeholder="At least 8 characters" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
              {fieldErrors.password ? <FieldMessage>{fieldErrors.password}</FieldMessage> : null}
            </Field>

            {message ? <FieldMessage>{message}</FieldMessage> : null}

            <Button className="w-full" disabled={busy} type="submit">
              {busy ? "Please wait..." : mode === "register" ? "Create account" : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
