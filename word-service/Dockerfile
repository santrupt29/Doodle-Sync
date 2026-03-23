# STAGE 1: Build the application
FROM maven:3.9.9-eclipse-temurin-21 AS builder

WORKDIR /app

# Cache dependencies to speed up future builds
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build
COPY src ./src
RUN mvn clean package -Dos.detected.classifier=linux-aarch_64 -DskipTests

# STAGE 2: Run the application
FROM eclipse-temurin:21-jre-alpine AS runner

WORKDIR /app

# Copy the built jar from the builder stage using a wildcard
COPY --from=builder /app/target/word-service-0.0.1-SNAPSHOT.jar app.jar

# Expose the correct port for this specific microservice (Update per service)
EXPOSE 8085

# Run the jar
ENTRYPOINT ["java", "-jar", "app.jar"]