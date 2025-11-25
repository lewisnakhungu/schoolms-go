package main // Every Go file starts with "package"

import (
	"schoolms-go/models" // Our database models
	"schoolms-go/routes" // Our API routes

	"github.com/gofiber/fiber/v2"           // Web server (like FastAPI)
	"github.com/gofiber/fiber/v2/middleware/cors"  // Allow frontend to connect
	"github.com/gofiber/fiber/v2/middleware/logger" // Print requests in terminal
)

func main() {
	// Connect to database (SQLite file will be created automatically)
	models.ConnectDB()

	// Create the Fiber app (like FastAPI())
	app := fiber.New()

	// Allow frontend (React, etc.) to talk to backend
	app.Use(cors.New())
	// Show nice logs when someone hits your API
	app.Use(logger.New())

	// Setup all API routes (signup, login, etc.)
	routes.SetupRoutes(app)

	// Start server on port 8001 (8000 is used by Python)
	// You’ll see: Listening on :8001
	app.Listen(":8001")
}