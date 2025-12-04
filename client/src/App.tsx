import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import IDE from "@/pages/ide";
import ColabSetup from "@/pages/colab-setup";
import { ApiSettingsModal } from "@/components/ApiSettingsModal";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/workspace" component={IDE} />
      <Route path="/colab-setup" component={ColabSetup} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
        <ApiSettingsModal />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
