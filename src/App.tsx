import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { CastProvider } from "./cast/CastProvider.tsx";
import CastReceiver from "./pages/CastReceiver.tsx";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/cast-receiver" element={<CastReceiver />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </CastProvider>
  </QueryClientProvider>
);

export default App;
