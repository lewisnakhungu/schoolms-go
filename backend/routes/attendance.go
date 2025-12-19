package routes

import (
	"net/http"
	"schoolms-go/middleware"
	"schoolms-go/models"
	"time"

	"github.com/gin-gonic/gin"
)

func RegisterAttendanceRoutes(router *gin.RouterGroup) {
	attendance := router.Group("/attendance")
	attendance.Use(middleware.AuthMiddleware())
	{
		// Teacher/Admin mark and view attendance
		attendance.POST("/mark", middleware.RoleGuard("TEACHER", "SCHOOLADMIN"), markAttendance)
		attendance.POST("/bulk", middleware.RoleGuard("TEACHER", "SCHOOLADMIN"), bulkMarkAttendance)
		attendance.GET("/class/:classId", middleware.RoleGuard("TEACHER", "SCHOOLADMIN", "FINANCE"), getClassAttendance)
		attendance.GET("/student/:studentId", middleware.RoleGuard("TEACHER", "SCHOOLADMIN", "PARENT"), getStudentAttendance)
		attendance.GET("/stats", middleware.RoleGuard("TEACHER", "SCHOOLADMIN"), getAttendanceStats)

		// Student views own attendance
		attendance.GET("/my", middleware.RoleGuard("STUDENT"), getMyAttendance)
	}
}

type MarkAttendanceInput struct {
	StudentID uint   `json:"student_id" binding:"required"`
	ClassID   uint   `json:"class_id" binding:"required"`
	Date      string `json:"date" binding:"required"` // YYYY-MM-DD
	Status    string `json:"status" binding:"required,oneof=PRESENT ABSENT LATE EXCUSED"`
	Notes     string `json:"notes"`
}

type BulkAttendanceInput struct {
	ClassID uint   `json:"class_id" binding:"required"`
	Date    string `json:"date" binding:"required"`
	Records []struct {
		StudentID uint   `json:"student_id"`
		Status    string `json:"status"`
		Notes     string `json:"notes"`
	} `json:"records" binding:"required"`
}

func markAttendance(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)
	userID := c.MustGet("userID").(uint)

	var input MarkAttendanceInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	date, err := time.Parse("2006-01-02", input.Date)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format. Use YYYY-MM-DD"})
		return
	}

	// Check if already marked
	var existing models.Attendance
	if err := models.DB.Where("student_id = ? AND date = ? AND school_id = ?",
		input.StudentID, date, schoolID).First(&existing).Error; err == nil {
		// Update existing
		existing.Status = input.Status
		existing.Notes = input.Notes
		existing.MarkedBy = userID
		models.DB.Save(&existing)
		c.JSON(http.StatusOK, existing)
		return
	}

	attendance := models.Attendance{
		StudentID: input.StudentID,
		ClassID:   input.ClassID,
		SchoolID:  schoolID,
		Date:      date,
		Status:    input.Status,
		Notes:     input.Notes,
		MarkedBy:  userID,
	}

	if err := models.DB.Create(&attendance).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to mark attendance"})
		return
	}

	c.JSON(http.StatusCreated, attendance)
}

func bulkMarkAttendance(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)
	userID := c.MustGet("userID").(uint)

	var input BulkAttendanceInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	date, err := time.Parse("2006-01-02", input.Date)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format"})
		return
	}

	var created, updated int
	for _, r := range input.Records {
		var existing models.Attendance
		if err := models.DB.Where("student_id = ? AND date = ? AND school_id = ?",
			r.StudentID, date, schoolID).First(&existing).Error; err == nil {
			existing.Status = r.Status
			existing.Notes = r.Notes
			existing.MarkedBy = userID
			models.DB.Save(&existing)
			updated++
		} else {
			models.DB.Create(&models.Attendance{
				StudentID: r.StudentID,
				ClassID:   input.ClassID,
				SchoolID:  schoolID,
				Date:      date,
				Status:    r.Status,
				Notes:     r.Notes,
				MarkedBy:  userID,
			})
			created++
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Attendance marked",
		"created": created,
		"updated": updated,
	})
}

func getClassAttendance(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)
	classID := c.Param("classId")
	dateStr := c.Query("date")

	query := models.DB.Where("class_id = ? AND school_id = ?", classID, schoolID).
		Preload("Student").Preload("Student.User")

	if dateStr != "" {
		if date, err := time.Parse("2006-01-02", dateStr); err == nil {
			query = query.Where("date = ?", date)
		}
	}

	var records []models.Attendance
	query.Order("date DESC, student_id").Find(&records)

	c.JSON(http.StatusOK, records)
}

func getStudentAttendance(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)
	studentID := c.Param("studentId")
	month := c.Query("month") // YYYY-MM format

	query := models.DB.Where("student_id = ? AND school_id = ?", studentID, schoolID)

	if month != "" {
		start, err := time.Parse("2006-01", month)
		if err == nil {
			end := start.AddDate(0, 1, 0)
			query = query.Where("date >= ? AND date < ?", start, end)
		}
	}

	var records []models.Attendance
	query.Order("date DESC").Find(&records)

	// Calculate summary
	var present, absent, late, excused int
	for _, r := range records {
		switch r.Status {
		case "PRESENT":
			present++
		case "ABSENT":
			absent++
		case "LATE":
			late++
		case "EXCUSED":
			excused++
		}
	}

	total := present + absent + late + excused
	rate := float64(0)
	if total > 0 {
		rate = float64(present+late) / float64(total) * 100
	}

	c.JSON(http.StatusOK, gin.H{
		"records": records,
		"summary": gin.H{
			"present":         present,
			"absent":          absent,
			"late":            late,
			"excused":         excused,
			"total_days":      total,
			"attendance_rate": rate,
		},
	})
}

func getMyAttendance(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)
	userID := c.MustGet("userID").(uint)

	// Find student
	var student models.Student
	if err := models.DB.Where("user_id = ? AND school_id = ?", userID, schoolID).First(&student).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Student not found"})
		return
	}

	// Get current month
	now := time.Now()
	start := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
	end := start.AddDate(0, 1, 0)

	var records []models.Attendance
	models.DB.Where("student_id = ? AND date >= ? AND date < ?", student.ID, start, end).
		Order("date DESC").Find(&records)

	var present, absent, late int
	for _, r := range records {
		switch r.Status {
		case "PRESENT":
			present++
		case "ABSENT":
			absent++
		case "LATE":
			late++
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"records":    records,
		"month":      now.Format("January 2006"),
		"present":    present,
		"absent":     absent,
		"late":       late,
		"total_days": len(records),
	})
}

func getAttendanceStats(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)

	// Today's date
	today := time.Now().Truncate(24 * time.Hour)

	// Today's attendance counts
	var todayPresent, todayAbsent, todayTotal int64
	models.DB.Model(&models.Attendance{}).Where("school_id = ? AND date = ? AND status = ?", schoolID, today, "PRESENT").Count(&todayPresent)
	models.DB.Model(&models.Attendance{}).Where("school_id = ? AND date = ? AND status = ?", schoolID, today, "ABSENT").Count(&todayAbsent)
	models.DB.Model(&models.Attendance{}).Where("school_id = ? AND date = ?", schoolID, today).Count(&todayTotal)

	// This week's average
	weekStart := today.AddDate(0, 0, -int(today.Weekday()))
	var weekRecords []models.Attendance
	models.DB.Where("school_id = ? AND date >= ?", schoolID, weekStart).Find(&weekRecords)

	weekPresent := 0
	for _, r := range weekRecords {
		if r.Status == "PRESENT" || r.Status == "LATE" {
			weekPresent++
		}
	}
	weekRate := float64(0)
	if len(weekRecords) > 0 {
		weekRate = float64(weekPresent) / float64(len(weekRecords)) * 100
	}

	c.JSON(http.StatusOK, gin.H{
		"today": gin.H{
			"present": todayPresent,
			"absent":  todayAbsent,
			"total":   todayTotal,
		},
		"week_attendance_rate": weekRate,
	})
}
