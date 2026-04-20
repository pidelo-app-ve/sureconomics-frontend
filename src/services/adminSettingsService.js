import { adminRequest } from "../lib/api";
import { unwrapEntity } from "./adminResponseUtils";

export const getCollaborativeSubmissionsSettings = async () =>
  unwrapEntity(await adminRequest("/admin/settings/collaborative-submissions"));

export const patchCollaborativeSubmissionsSettings = async (body) =>
  unwrapEntity(
    await adminRequest("/admin/settings/collaborative-submissions", { method: "PATCH", json: body })
  );
