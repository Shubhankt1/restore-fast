import { errorResponse, successResponse } from "@/lib/errors";
import { parseJsonRequest } from "@/lib/request";
import { createProject, listProjects } from "@/lib/punchlist";

export const runtime = "nodejs";

export async function GET() {
  try {
    return successResponse(await listProjects());
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseJsonRequest(request);
    const project = await createProject(body);

    return successResponse(project, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
