package main

import (
	"log"
	"os"
	"schoolms-go/models"
	"schoolms-go/routes"
	"schoolms-go/utils"

	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Connect to database
	models.ConnectDB()

	// Initialize Gin
	r := gin.Default()

	// CORS Configuration
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Setup Routes
	api := r.Group("/api/v1")
	routes.RegisterAuthRoutes(api)
	routes.RegisterSuperAdminRoutes(api)
	routes.RegisterInviteRoutes(api)
	routes.RegisterClassRoutes(api)
	routes.RegisterStudentRoutes(api)
	routes.RegisterFinanceRoutes(api)
	routes.RegisterReportRoutes(api)
	routes.RegisterTicketRoutes(api)
	routes.RegisterNotificationRoutes(api)
	routes.RegisterTeacherRoutes(api)
	routes.RegisterContentRoutes(api)
	routes.RegisterGradeRoutes(api)
	routes.RegisterAttendanceRoutes(api)
	routes.RegisterParentRoutes(api)
	routes.RegisterTimetableRoutes(api)
	routes.RegisterParentLinkRoutes(api)
	routes.RegisterAnalyticsRoutes(api)
	routes.RegisterVoteHeadRoutes(api)
	routes.RegisterMpesaRoutes(api)
	routes.RegisterTVETRoutes(api)
	routes.RegisterSMSRoutes(api)
	routes.RegisterImportRoutes(api)
	routes.RegisterAuditRoutes(api)

	// Serve uploaded files
	r.Static("/uploads", "./uploads")

	// Seed Superadmin
	utils.SeedSuperAdmin()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server: ", err)
	}
}
