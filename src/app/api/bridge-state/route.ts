import bridgeStateService from "@/src/features/bridge-state/bridge-state.service";
import { errorMessage, logError } from "@/src/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const jsonError = (message: string, status: number, details?: unknown) =>
  Response.json({ error: message, details }, { status });

const readJson = async (request: Request): Promise<unknown> => {
  try {
    return await request.json();
  } catch {
    throw new Error("Invalid JSON request body.");
  }
};

const bridgeStateError = (error: unknown, fallbackMessage: string) => {
  if (bridgeStateService.isValidationError(error)) {
    return jsonError(error.message, 400, { issues: error.issues });
  }

  logError("BridgeStateRoute", fallbackMessage, error);

  return jsonError(fallbackMessage, 500);
};

export async function GET() {
  try {
    const currentState = await bridgeStateService.getCurrentBridgeState();

    return Response.json({ currentState });
  } catch (error) {
    logError(
      "BridgeStateRoute",
      "Failed to retrieve current bridge state.",
      error,
    );

    return jsonError("Failed to retrieve current bridge state.", 500);
  }
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await readJson(request);
  } catch (error) {
    return jsonError(errorMessage(error, "Invalid JSON request body."), 400);
  }

  try {
    const result = await bridgeStateService.addBridgeStateEventFromPayload(body);

    if (!result.eventId) {
      return Response.json(
        {
          accepted: false,
          reason: "device_updates_disabled",
          currentState: result.currentState,
        },
        { status: 202 },
      );
    }

    return Response.json(
      {
        accepted: true,
        eventId: result.eventId,
        currentState: result.currentState,
      },
      { status: 201 },
    );
  } catch (error) {
    return bridgeStateError(error, "Failed to apply bridge state event.");
  }
}

export async function PATCH(request: Request) {
  let body: unknown;

  try {
    body = await readJson(request);
  } catch (error) {
    return jsonError(errorMessage(error, "Invalid JSON request body."), 400);
  }

  try {
    const currentState = await bridgeStateService.toggleAcceptsDeviceUpdatesFromPayload(
      body,
    );

    return Response.json({ currentState });
  } catch (error) {
    return bridgeStateError(error, "Failed to update device update toggle.");
  }
}
