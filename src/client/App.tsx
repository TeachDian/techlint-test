import { AuthScreen } from "@client/components/auth-screen";
import { BoardPage } from "@client/components/board-page";
import { ToastViewport } from "@client/components/toast-viewport";
import { Card, CardContent, CardHeader, CardTitle } from "@client/components/ui/card";
import { AuthProvider, useAuth } from "@client/contexts/AuthContext";
import { BoardProvider } from "@client/contexts/BoardContext";
import { ToastProvider } from "@client/contexts/ToastContext";

function LoadingState() {
  return (
    <main className="app-shell">
      <div className="app-container">
        <Card className="max-w-2xl shadow-board">
          <CardHeader>
            <CardTitle className="text-2xl">Loading session</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="status-note">Checking your account before opening the board.</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function AppShell() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingState />;
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <BoardProvider key={user.id}>
      <BoardPage />
    </BoardProvider>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <ToastViewport />
        <AppShell />
      </AuthProvider>
    </ToastProvider>
  );
}
