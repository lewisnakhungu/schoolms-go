package routes

import (
	"net/http"
	"schoolms-go/middleware"
	"schoolms-go/models"
	"schoolms-go/services"

	"github.com/gin-gonic/gin"
)

func RegisterSMSRoutes(router *gin.RouterGroup) {
	sms := router.Group("/sms")
	sms.Use(middleware.AuthMiddleware(), middleware.RoleGuard("SCHOOLADMIN"))
	{
		sms.POST("/send", sendSingleSMS)
		sms.POST("/broadcast", sendBroadcastSMS)
		sms.POST("/fee-reminders", sendFeeReminders)
		sms.GET("/logs", getSMSLogs)
	}
}

type SendSMSInput struct {
	Phone   string `json:"phone" binding:"required"`
	Message string `json:"message" binding:"required"`
}

func sendSingleSMS(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)

	var input SendSMSInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result := services.SendSMS(input.Phone, input.Message)
	services.LogSMSSent(schoolID, input.Phone, input.Message, result)

	c.JSON(http.StatusOK, gin.H{
		"success": result.Success,
		"status":  result.Status,
		"cost":    result.Cost,
		"error":   result.Error,
	})
}

type BroadcastInput struct {
	Message string `json:"message" binding:"required"`
	Target  string `json:"target" binding:"required"` // STUDENTS, PARENTS, ALL
	ClassID *uint  `json:"class_id"`                  // Optional filter
}

func sendBroadcastSMS(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)

	var input BroadcastInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get school name
	var school models.School
	models.DB.First(&school, schoolID)

	// Collect phone numbers based on target
	var phones []string

	if input.Target == "STUDENTS" || input.Target == "ALL" {
		var students []models.Student
		query := models.DB.Where("school_id = ?", schoolID)
		if input.ClassID != nil {
			query = query.Where("class_id = ?", *input.ClassID)
		}
		query.Preload("User").Find(&students)

		for _, s := range students {
			if s.User.Email != "" { // Using email as phone placeholder
				phones = append(phones, s.User.Email)
			}
		}
	}

	if input.Target == "PARENTS" || input.Target == "ALL" {
		var links []models.ParentStudent
		models.DB.Joins("JOIN students ON students.id = parent_students.student_id").
			Where("students.school_id = ?", schoolID).
			Preload("Parent").Find(&links)

		for _, l := range links {
			if l.Parent.Email != "" {
				phones = append(phones, l.Parent.Email)
			}
		}
	}

	// Remove duplicates
	phoneMap := make(map[string]bool)
	uniquePhones := []string{}
	for _, p := range phones {
		if !phoneMap[p] {
			phoneMap[p] = true
			uniquePhones = append(uniquePhones, p)
		}
	}

	// Build messages
	messages := make([]services.SMSMessage, len(uniquePhones))
	for i, phone := range uniquePhones {
		messages[i] = services.SMSMessage{
			To:      phone,
			Message: school.Name + ": " + input.Message,
		}
	}

	// Send (async in background)
	go func() {
		results := services.SendBulkSMS(messages)
		for i, r := range results {
			services.LogSMSSent(schoolID, uniquePhones[i], input.Message, r)
		}
	}()

	c.JSON(http.StatusOK, gin.H{
		"message":    "Broadcast queued",
		"recipients": len(uniquePhones),
	})
}

func sendFeeReminders(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)

	var input struct {
		MinBalance float64 `json:"min_balance"` // Only students owing >= this
	}
	c.ShouldBindJSON(&input)

	if input.MinBalance == 0 {
		input.MinBalance = 1000 // Default 1000 KES
	}

	// Get students with outstanding balances
	type StudentBalance struct {
		StudentID   uint
		StudentName string
		ParentPhone string
		Balance     float64
	}

	var balances []StudentBalance
	models.DB.Raw(`
		SELECT 
			s.id as student_id,
			u.email as student_name,
			u.email as parent_phone,
			COALESCE(SUM(vhb.balance), 0) as balance
		FROM students s
		JOIN users u ON u.id = s.user_id
		LEFT JOIN vote_head_balances vhb ON vhb.student_id = s.id
		WHERE s.school_id = ?
		GROUP BY s.id, u.email
		HAVING COALESCE(SUM(vhb.balance), 0) >= ?
	`, schoolID, input.MinBalance).Scan(&balances)

	// Send reminders
	var sent int
	for _, b := range balances {
		if b.ParentPhone != "" {
			result := services.SendFeeReminder(b.ParentPhone, b.StudentName, b.Balance)
			services.LogSMSSent(schoolID, b.ParentPhone, "Fee reminder", result)
			if result.Success {
				sent++
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"total_defaulters": len(balances),
		"reminders_sent":   sent,
	})
}

func getSMSLogs(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)

	var logs []services.SMSLog
	models.DB.Where("school_id = ?", schoolID).
		Order("created_at DESC").
		Limit(100).
		Find(&logs)

	c.JSON(http.StatusOK, logs)
}
