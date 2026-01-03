import NavBar from "@/components/NavBar";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="mx-auto max-w-5xl p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Echo — Personal AI Assistant</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Speed-focused, privacy-first. Use the Chat for conversations, Tools for web search and nearby help, and Settings to configure your Brain API.
            </p>
            <div className="flex gap-2">
              <Link to="/chat"><Button>Open Chat</Button></Link>
              <Link to="/tools"><Button variant="secondary">Open Tools</Button></Link>
              <Link to="/settings"><Button variant="outline">Settings</Button></Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <ul className="list-disc pl-6 text-sm text-muted-foreground">
              <li>Set your Brain API Base URL in Settings.</li>
              <li>Private Mode prevents saving history by default.</li>
              <li>Use Tools → Nearby Places for quick navigation handoff.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Index;