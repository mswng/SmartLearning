import "./Button.scss";

/**
 * Nút dùng chung toàn app.
 * variant: "primary" | "secondary" | "danger" | "ghost"
 */
function Button({
  children,
  variant = "primary",
  full = false,
  loading = false,
  disabled = false,
  type = "button",
  onClick,
  ...rest
}) {
  return (
    <button
      type={type}
      className={`btn btn--${variant}${full ? " btn--full" : ""}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...rest}
    >
      {loading && <span className="btn__spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}

export default Button;
