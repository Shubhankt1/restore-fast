import { errorResponse, successResponse } from "@/lib/errors";
import { parseJsonRequest } from "@/lib/request";
import { updatePunchItemPhoto } from "@/lib/punchlist";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ punchItemId: string }> },
) {
  try {
    const { punchItemId } = await context.params;
    const body = await parseJsonRequest(request);
    const punchItem = await updatePunchItemPhoto(punchItemId, body);

    return successResponse(punchItem);
  } catch (error) {
    return errorResponse(error);
  }
}
