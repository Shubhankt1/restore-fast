import { errorResponse, successResponse } from "@/lib/errors";
import { parseJsonRequest } from "@/lib/request";
import { updatePunchItemAssignment } from "@/lib/punchlist";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ punchItemId: string }> },
) {
  try {
    const { punchItemId } = await context.params;
    const body = await parseJsonRequest(request);
    const punchItem = await updatePunchItemAssignment(punchItemId, body);

    return successResponse(punchItem);
  } catch (error) {
    return errorResponse(error);
  }
}
