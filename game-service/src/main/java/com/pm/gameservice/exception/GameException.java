package com.pm.gameservice.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;

@Getter
public class GameException extends RuntimeException {

    private final HttpStatus httpStatus;
    public GameException(String message, HttpStatus httpStatus) {
        super(message);
        this.httpStatus = httpStatus;
    }

    public static GameException notFound(String msg) {
        return new GameException(msg, HttpStatus.NOT_FOUND);
    }
    public static GameException badRequest(String msg) {
        return new GameException(msg, HttpStatus.BAD_REQUEST);
    }
    public static GameException conflict(String msg) {
        return new GameException(msg, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(GameException.class)
    public ResponseEntity<String> handleGameException(GameException ex) {
        return ResponseEntity
                .status(ex.getHttpStatus())
                .body(ex.getMessage());
    }
}
