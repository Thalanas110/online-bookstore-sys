import { Code } from 'lucide-react';

import { Alert, AlertDescription } from './ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

export function SetupGuide() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="max-w-5xl w-full">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Code className="size-6 text-primary" />
            <CardTitle className="text-2xl">Appwrite + MongoDB Setup Required</CardTitle>
          </div>
          <CardDescription>
            This build expects real Appwrite authentication, a deployed Appwrite Function, and MongoDB storage.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <Alert>
            <AlertDescription>
              The frontend signs in directly with Appwrite, then calls the Function API over HTTPS with short-lived Appwrite JWT bearer tokens.
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="cloud" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="cloud">Appwrite Cloud</TabsTrigger>
              <TabsTrigger value="self">Self-Hosted</TabsTrigger>
            </TabsList>

            <TabsContent value="cloud" className="space-y-4">
              <div className="space-y-3">
                <h3 className="text-lg">Cloud Setup</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Create an Appwrite project.</li>
                  <li>Add a Web platform for `http://localhost:5173` and your production frontend origin.</li>
                  <li>Enable Email/Password authentication.</li>
                  <li>Create a Function API key with `users.read` and `users.write` scopes.</li>
                  <li>Deploy the checked-in `bookstore-api` Function.</li>
                </ol>

                <div className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-x-auto">
                  <pre className="text-sm">
{`VITE_APPWRITE_ENDPOINT=https://<REGION>.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=<APPWRITE_PROJECT_ID>
VITE_API_BASE_URL=https://<bookstore-api-function-domain>/api`}
                  </pre>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="self" className="space-y-4">
              <div className="space-y-3">
                <h3 className="text-lg">Self-Hosted Setup</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Install Appwrite and create a project.</li>
                  <li>Add a Web platform for your frontend origin.</li>
                  <li>Enable Email/Password authentication.</li>
                  <li>Create the same Function API key scopes: `users.read`, `users.write`.</li>
                  <li>Deploy the checked-in Function and use its HTTPS domain for `VITE_API_BASE_URL`.</li>
                </ol>

                <div className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-x-auto">
                  <pre className="text-sm">
{`VITE_APPWRITE_ENDPOINT=http://localhost/v1
VITE_APPWRITE_PROJECT_ID=<APPWRITE_PROJECT_ID>
VITE_API_BASE_URL=http://bookstore-api.localhost/api`}
                  </pre>
                </div>

                <p className="text-sm text-muted-foreground">
                  Plain HTTP is only acceptable for localhost development. Use HTTPS everywhere else.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="space-y-3 pt-4 border-t">
            <h3 className="text-lg">Function Variables</h3>
            <div className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm">
{`APPWRITE_ENDPOINT=https://<REGION>.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=<APPWRITE_PROJECT_ID>
APPWRITE_API_KEY=<FUNCTION_API_KEY>
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/?retryWrites=true&w=majority
MONGODB_DB_NAME=online_bookstore
AES_KEY_BASE64=<32_BYTE_BASE64_KEY>
API_BASE_PATH=/api
CORS_ALLOWED_ORIGINS=http://localhost:5173,https://bookstore.example.com`}
              </pre>
            </div>
            <p className="text-sm text-muted-foreground">
              The Function creates MongoDB indexes automatically on first successful start.
            </p>
          </div>

          <div className="space-y-3 pt-4 border-t">
            <h3 className="text-lg">Security Notes</h3>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>All frontend-to-backend traffic should use HTTPS.</li>
              <li>Keep `APPWRITE_API_KEY` only in Function environment variables.</li>
              <li>Use exact `CORS_ALLOWED_ORIGINS`; do not use a wildcard.</li>
              <li>Addresses are encrypted server-side with AES-256-GCM before MongoDB storage.</li>
              <li>Admin access is determined by Appwrite user preferences: `{"role":"admin"}`.</li>
            </ul>
          </div>

          <Alert>
            <AlertDescription>
              Generate `AES_KEY_BASE64` with `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"` and store it as a Function secret, not in the frontend.
            </AlertDescription>
          </Alert>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              After updating environment variables or Function settings, redeploy the Function and restart the frontend dev server.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
