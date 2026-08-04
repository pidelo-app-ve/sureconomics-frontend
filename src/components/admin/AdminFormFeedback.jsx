import PropTypes from "prop-types";

/**
 * Result of a form action, rendered next to the buttons that triggered it.
 *
 * The toast in `AdminToastViewport` is the primary signal, but it fades; this
 * stays put so an error message can be read and acted on without re-submitting.
 *
 * @param {{ tone?: "success" | "error", message?: string }} props
 */
export const AdminFormFeedback = ({ tone, message }) => {
  if (!message) return null;
  const isError = tone === "error";
  return (
    <p
      className={
        isError
          ? "se-admin-login__error se-admin-form-feedback"
          : "se-admin-form-feedback se-admin-form-feedback--ok"
      }
      role={isError ? "alert" : "status"}
    >
      {message}
    </p>
  );
};

AdminFormFeedback.propTypes = {
  tone: PropTypes.oneOf(["success", "error"]),
  message: PropTypes.string,
};
