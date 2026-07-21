import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { DevicesTable } from "./components/DevicesTable.tsx";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DevicesTable />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
