/**
 * La ficha del autor de un envío en el panel (`adminSubmissionAuthor.js`), con lo que
 * manda de verdad el backend: el envío (`SubmissionAdminResponseSchema`, con `user_id` y
 * `autor`) y la cuenta del lector (`PublicUserAdminSchema`, sin rol). `npm test`.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSubmissionAuthorBoard, resolveSubmissionAuthorUserIdFromNormalized } from "./adminSubmissionAuthor.js";

const ENVIO = {
  id: 12,
  user_id: 7,
  format: "articulos",
  title: "El bolívar en noviembre",
  excerpt: "Entradilla",
  content: "<p>Texto</p>",
  featured_image_url: null,
  status: "submitted",
  admin_notes: null,
  notes: [],
  submitted_at: "2026-11-20T10:00:00",
  reviewed_at: null,
  published_post_id: null,
  published_post_slug: null,
  autor: { id: 7, nombre: "María Hernández", email: "maria@ejemplo.com", foto_id: null, foto_url: null },
  firma_publicada: null,
  created_at: "2026-11-20T10:00:00",
  updated_at: "2026-11-20T10:00:00",
};

const CUENTA = {
  id: 7,
  email: "maria@ejemplo.com",
  first_name: "María",
  last_name: "Hernández",
  age: 34,
  sex: "F",
  country: "Venezuela",
  city: "Caracas",
  occupation: "Economista",
  phone_number: null,
  is_email_verified: true,
  is_active: true,
  can_submit_collaborative_articles: true,
  last_login_at: null,
  created_at: "2026-10-01T09:00:00",
  updated_at: "2026-11-20T10:00:00",
};

test("el autor sale del `user_id` del envío, con o sin la cuenta", () => {
  assert.equal(resolveSubmissionAuthorUserIdFromNormalized(ENVIO, null), "7");
  assert.equal(resolveSubmissionAuthorUserIdFromNormalized(ENVIO, CUENTA), "7");
  // Sin `user_id` en el envío, el de la cuenta pedida aparte.
  const { user_id: _fuera, ...sinUsuario } = ENVIO;
  assert.equal(resolveSubmissionAuthorUserIdFromNormalized(sinUsuario, CUENTA), "7");
  assert.equal(resolveSubmissionAuthorUserIdFromNormalized(sinUsuario, null), "");
});

test("la ficha con la cuenta: nombre, correo, datos y alta; sin fila «Rol»", () => {
  const ficha = buildSubmissionAuthorBoard({ success: true, data: ENVIO }, { success: true, data: CUENTA });
  assert.equal(ficha.userId, "7");
  assert.equal(ficha.displayName, "María Hernández");
  assert.equal(ficha.initials, "MH");
  assert.equal(ficha.adminUserHref, "/admin/users/7");
  assert.deepEqual(
    ficha.rows.map((r) => r.label),
    ["Nombre", "Correo", "Edad", "Sexo", "País", "Ciudad", "Ocupación", "Colaboraciones", "Registro del usuario"],
  );
  assert.ok(!ficha.rows.some((r) => r.label === "Rol"));
});

test("sin la cuenta (aún no llegó): solo lo que trae el envío", () => {
  const ficha = buildSubmissionAuthorBoard(ENVIO, null);
  assert.equal(ficha.userId, "7");
  assert.equal(ficha.displayName, "");
  assert.deepEqual(ficha.rows, []);
});
