import { createApplication } from './app.js';
import { createAppwriteService } from './appwrite.js';
import { loadConfig } from './config.js';
import { createRouteHandlers } from './services.js';
import { createTablesDatabase } from './tablesdb.js';

let bootstrapPromise;

async function bootstrap() {
  const config = loadConfig(process.env);
  const database = await createTablesDatabase(config);
  const appwrite = createAppwriteService(config);
  const routeHandlers = createRouteHandlers({
    appwrite,
    config,
    database,
  });

  return createApplication({
    config,
    appwrite,
    routeHandlers,
  });
}

function getApplication() {
  if (!bootstrapPromise) {
    bootstrapPromise = bootstrap().catch(error => {
      bootstrapPromise = undefined;
      throw error;
    });
  }

  return bootstrapPromise;
}

function sendResponse(res, response) {
  const headers = response.headers ?? {};

  if (response.statusCode === 204 || response.body === undefined) {
    return res.text('', response.statusCode, headers);
  }

  return res.json(response.body, response.statusCode, headers);
}

export default async ({ req, res, error }) => {
  try {
    const app = await getApplication();
    const response = await app({
      method: req.method,
      path: req.path,
      headers: req.headers ?? {},
      query: req.query ?? {},
      bodyText: req.bodyText,
      bodyJson: req.bodyJson,
    });

    return sendResponse(res, response);
  } catch (failure) {
    error(failure?.stack || failure?.message || String(failure));
    return res.json({
      message: 'Bookstore API bootstrap failed',
      code: 500,
      type: 'bootstrap_error',
    }, 500, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    });
  }
};
