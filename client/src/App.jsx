import { BrowserRouter, Routes, Route } from "react-router-dom";
import RootRedirect from "./routes/RootRedirect";
import ProtectedRoute from "./routes/ProtectedRoute";
import PublicOnlyRoute from "./routes/PublicOnlyRoute";
import AppShell from "./components/AppShell";
import Login from "./pages/Login";
import New from "./pages/New";
import Chat from "./pages/Chat";
import NotFound from "./pages/NotFound";
import Chats from "./pages/Chats";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<Login />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/new" element={<New />} />
            <Route path="/chat/:chatId" element={<Chat />} />
            <Route path="/chats" element={<Chats />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}