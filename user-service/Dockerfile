# ── STAGE 1: Build ───────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app

# 1. Copy pom.xml first to cache dependencies (Speeds up future builds)
COPY pom.xml .
RUN mvn dependency:go-offline -B --no-transfer-progress

# 2. Copy source code
COPY src ./src

# 3. Build the JAR (Includes the Apple Silicon ARM fix and keeps logs clean)
RUN mvn clean package -DskipTests -Dos.detected.classifier=linux-aarch_64 --no-transfer-progress


# ── STAGE 2: Run ─────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine AS runner
WORKDIR /app

# 4. Add curl for Docker/Kubernetes health checks
RUN apk add --no-cache curl

# 5. Copy the built JAR using a wildcard (Immune to version changes!)
COPY --from=builder /app/target/*.jar app.jar

# 6. Set production-ready JVM memory limits to prevent silent crashes
ENV JAVA_OPTS="-XX:+UseContainerSupport \
               -XX:MaxRAMPercentage=75.0 \
               -XX:+ExitOnOutOfMemoryError"

# 7. Expose the port (Change this to match your specific microservice port)
EXPOSE 8084

# 8. Start the application
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]