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
    <main className="auth-shell">
      <Card className="auth-panel">
        <CardHeader className="space-y-4 border-b pb-5">
          <div className="space-y-1">
            <p className="section-kicker">Task board</p>
            <CardTitle className="text-2xl">{mode === "register" ? "Create account" : "Sign in"}</CardTitle>
            <p className="text-sm text-muted-foreground">Each account gets its own private workspace.</p>
          </div>

          <div className="auth-mode-switch">
            <Button onClick={() => setMode("register")} variant={mode === "register" ? "default" : "ghost"}>
              Register
            </Button>
            <Button onClick={() => setMode("login")} variant={mode === "login" ? "default" : "ghost"}>
              Login
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-5">
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
