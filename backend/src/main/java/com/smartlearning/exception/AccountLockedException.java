package com.smartlearning.exception;

/** Ném ra khi user cố đăng nhập nhưng tài khoản đã bị admin khóa (User.enabled = false). */
public class AccountLockedException extends RuntimeException {
    public AccountLockedException(String message) {
        super(message);
    }
}
