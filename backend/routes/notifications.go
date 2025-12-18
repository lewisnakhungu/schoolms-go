package routes

import (
	"net/http"
	"schoolms-go/middleware"
	"schoolms-go/models"
	"time"

	"github.com/gin-gonic/gin"
)

type CreateNotificationInput struct {
	TargetType string `json:"target_type" binding:"required,oneof=ALL CLASS STUDENT"`
	TargetID   *uint  `json:"target_id"` // Required if TargetType is CLASS or STUDENT
	Title      string `json:"title" binding:"required"`
	Message    string `json:"message" binding:"required"`
	Category   string `json:"category" binding:"required,oneof=FEE_REMINDER ANNOUNCEMENT ALERT"`
}

func RegisterNotificationRoutes(router *gin.RouterGroup) {
	notifications := router.Group("/notifications")
	notifications.Use(middleware.AuthMiddleware())
	{
		// SchoolAdmin can create and manage notifications
		notifications.POST("", middleware.RoleGuard("SCHOOLADMIN", "TEACHER"), createNotification)
		notifications.GET("", middleware.RoleGuard("SCHOOLADMIN", "TEACHER"), listNotifications)
		notifications.DELETE("/:id", middleware.RoleGuard("SCHOOLADMIN"), deleteNotification)

		// Students can view their notifications
		notifications.GET("/my", middleware.RoleGuard("STUDENT"), getMyNotifications)
		notifications.POST("/:id/read", middleware.RoleGuard("STUDENT"), markAsRead)
	}
}

// createNotification - SchoolAdmin/Teacher creates a notification
func createNotification(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)
	userID := c.MustGet("userID").(uint)

	var input CreateNotificationInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate target_id is provided for CLASS and STUDENT types
	if input.TargetType != "ALL" && input.TargetID == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "target_id is required for CLASS or STUDENT notifications"})
		return
	}

	notification := models.Notification{
		SchoolID:   schoolID,
		SenderID:   userID,
		TargetType: input.TargetType,
		TargetID:   input.TargetID,
		Title:      input.Title,
		Message:    input.Message,
		Category:   input.Category,
	}

	if err := models.DB.Create(&notification).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create notification"})
		return
	}

	c.JSON(http.StatusCreated, notification)
}

// listNotifications - List all notifications for the school
func listNotifications(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)

	var notifications []models.Notification
	models.DB.Where("school_id = ?", schoolID).
		Preload("Sender").
		Order("created_at DESC").
		Find(&notifications)

	c.JSON(http.StatusOK, notifications)
}

// deleteNotification - SchoolAdmin deletes a notification
func deleteNotification(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)
	notificationID := c.Param("id")

	var notification models.Notification
	if err := models.DB.Where("id = ? AND school_id = ?", notificationID, schoolID).First(&notification).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Notification not found"})
		return
	}

	models.DB.Delete(&notification)
	c.JSON(http.StatusOK, gin.H{"message": "Notification deleted"})
}

// getMyNotifications - Student gets notifications targeted at them
func getMyNotifications(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)
	userID := c.MustGet("userID").(uint)

	// Get student's class
	var student models.Student
	if err := models.DB.Where("user_id = ? AND school_id = ?", userID, schoolID).First(&student).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Student not found"})
		return
	}

	var notifications []models.Notification

	// Get notifications: ALL, their CLASS, or directly to them
	query := models.DB.Where("school_id = ?", schoolID).
		Where("target_type = ? OR (target_type = ? AND target_id = ?) OR (target_type = ? AND target_id = ?)",
			"ALL",
			"CLASS", student.ClassID,
			"STUDENT", student.ID,
		).
		Preload("Sender").
		Order("created_at DESC")

	query.Find(&notifications)

	// Get read status for each notification
	var readNotifications []models.NotificationRead
	models.DB.Where("student_id = ?", student.ID).Find(&readNotifications)

	readMap := make(map[uint]bool)
	for _, r := range readNotifications {
		readMap[r.NotificationID] = true
	}

	// Build response with read status
	type NotificationWithRead struct {
		models.Notification
		IsRead bool `json:"is_read"`
	}

	result := make([]NotificationWithRead, 0)
	for _, n := range notifications {
		result = append(result, NotificationWithRead{
			Notification: n,
			IsRead:       readMap[n.ID],
		})
	}

	c.JSON(http.StatusOK, result)
}

// markAsRead - Student marks a notification as read
func markAsRead(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)
	userID := c.MustGet("userID").(uint)
	notificationID := c.Param("id")

	// Get student
	var student models.Student
	if err := models.DB.Where("user_id = ? AND school_id = ?", userID, schoolID).First(&student).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Student not found"})
		return
	}

	// Check notification exists
	var notification models.Notification
	if err := models.DB.First(&notification, notificationID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Notification not found"})
		return
	}

	// Create or update read record
	var read models.NotificationRead
	result := models.DB.Where("notification_id = ? AND student_id = ?", notification.ID, student.ID).First(&read)

	if result.RowsAffected == 0 {
		read = models.NotificationRead{
			NotificationID: notification.ID,
			StudentID:      student.ID,
			ReadAt:         time.Now(),
		}
		models.DB.Create(&read)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Marked as read"})
}
