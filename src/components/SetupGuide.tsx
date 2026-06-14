import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Code } from 'lucide-react';

export function SetupGuide() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="max-w-4xl w-full">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Code className="size-6 text-primary" />
            <CardTitle className="text-2xl">Appwrite Setup Required</CardTitle>
          </div>
          <CardDescription>
            Configure your Appwrite credentials to get started
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertDescription>
              This application requires Appwrite to be configured. Follow the steps below to set up your backend.
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="cloud" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="cloud">Appwrite Cloud</TabsTrigger>
              <TabsTrigger value="self">Self-Hosted</TabsTrigger>
            </TabsList>

            <TabsContent value="cloud" className="space-y-4">
              <div className="space-y-3">
                <h3 className="text-lg">Setup with Appwrite Cloud</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>
                    Go to{' '}
                    <a
                      href="https://cloud.appwrite.io"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      cloud.appwrite.io
                    </a>
                    {' '}and create an account
                  </li>
                  <li>Create a new project</li>
                  <li>Copy your Project ID from the dashboard</li>
                  <li>Create a <code className="bg-muted px-1 py-0.5 rounded">.env</code> file in your project root</li>
                  <li>Add the following environment variables:</li>
                </ol>

                <div className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-x-auto">
                  <pre className="text-sm">
{`VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your_project_id_here`}
                  </pre>
                </div>

                <p className="text-sm text-muted-foreground">
                  Replace <code className="bg-muted px-1 py-0.5 rounded">your_project_id_here</code> with your actual Project ID
                </p>
              </div>
            </TabsContent>

            <TabsContent value="self" className="space-y-4">
              <div className="space-y-3">
                <h3 className="text-lg">Setup with Self-Hosted Appwrite</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>
                    Install Appwrite using{' '}
                    <a
                      href="https://appwrite.io/docs/installation"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Docker
                    </a>
                  </li>
                  <li>Access your Appwrite console (typically at http://localhost)</li>
                  <li>Create a new project and copy the Project ID</li>
                  <li>Create a <code className="bg-muted px-1 py-0.5 rounded">.env</code> file in your project root</li>
                  <li>Add the following environment variables:</li>
                </ol>

                <div className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-x-auto">
                  <pre className="text-sm">
{`VITE_APPWRITE_ENDPOINT=http://localhost/v1
VITE_APPWRITE_PROJECT_ID=your_project_id_here`}
                  </pre>
                </div>

                <p className="text-sm text-muted-foreground">
                  Replace the endpoint with your Appwrite server URL and add your Project ID
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="space-y-3 pt-4 border-t">
            <h3 className="text-lg">Database Setup (Optional)</h3>
            <p className="text-sm text-muted-foreground">
              The app currently uses mock data. To connect to a real database:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Create a database in your Appwrite project</li>
              <li>Create collections for books and orders</li>
              <li>Update the API methods in <code className="bg-muted px-1 py-0.5 rounded">src/lib/api.ts</code></li>
              <li>See README.md for detailed schema information</li>
            </ol>
          </div>

          <Alert>
            <AlertDescription>
              🔒 <strong>Security Note:</strong> All sensitive data is encrypted using AES-256-GCM encryption.
              The app uses Web Crypto API for client-side encryption before sending data to the server.
            </AlertDescription>
          </Alert>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              After configuring your <code className="bg-muted px-1 py-0.5 rounded">.env</code> file,
              restart your development server for changes to take effect.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
