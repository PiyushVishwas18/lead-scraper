# Stage 1: Build stage
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app

# Copy Maven wrapper and pom.xml for dependency resolution caching
COPY .mvn/ .mvn
COPY mvnw pom.xml ./
RUN chmod +x ./mvnw

# Download project dependencies
RUN ./mvnw dependency:go-offline -B

# Copy application source code and package the Spring Boot jar
COPY src ./src
RUN ./mvnw clean package -DskipTests

# Stage 2: Production Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Expose default port (Render will override via PORT environment variable)
EXPOSE 8080

# Copy compiled jar artifact from build stage
COPY --from=build /app/target/backend-0.0.1-SNAPSHOT.jar app.jar

# Start application
ENTRYPOINT ["java", "-jar", "app.jar"]
