package routes

import (
	"net/http"
	"schoolms-go/middleware"
	"schoolms-go/models"

	"github.com/gin-gonic/gin"
)

func RegisterParentRoutes(router *gin.RouterGroup) {
	parent := router.Group("/parent")
	parent.Use(middleware.AuthMiddleware(), middleware.RoleGuard("PARENT"))
	{
		parent.GET("/children", getMyChildren)
		parent.GET("/child/:studentId/grades", getChildGrades)
		parent.GET("/child/:studentId/attendance", getChildAttendance)
		parent.GET("/child/:studentId/fees", getChildFees)
		parent.GET("/dashboard", getParentDashboard)
	}
}

// getMyChildren - Get list of children linked to parent
func getMyChildren(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)
	userID := c.MustGet("userID").(uint)

	var links []models.ParentStudent
	models.DB.Where("parent_id = ?", userID).
		Preload("Student").
		Preload("Student.User").
		Preload("Student.Class").
		Find(&links)

	// Filter by school
	var children []gin.H
	for _, link := range links {
		if link.Student.SchoolID == schoolID {
			children = append(children, gin.H{
				"id":                link.Student.ID,
				"name":              link.Student.User.FullName,
				"email":             link.Student.User.Email,
				"enrollment_number": link.Student.EnrollmentNumber,
				"class":             link.Student.Class,
				"relation":          link.Relation,
			})
		}
	}

	c.JSON(http.StatusOK, children)
}

// getChildGrades - Get grades for a specific child
func getChildGrades(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)
	userID := c.MustGet("userID").(uint)
	studentID := c.Param("studentId")

	// Verify parent-child relationship
	var link models.ParentStudent
	if err := models.DB.Where("parent_id = ? AND student_id = ?", userID, studentID).First(&link).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized to view this student"})
		return
	}

	var grades []models.Grade
	models.DB.Where("student_id = ? AND school_id = ?", studentID, schoolID).
		Preload("Class").
		Order("year DESC, term, subject").
		Find(&grades)

	// Calculate summary
	var totalScore, totalMax float64
	for _, g := range grades {
		totalScore += g.Score
		totalMax += g.MaxScore
	}

	average := float64(0)
	if totalMax > 0 {
		average = (totalScore / totalMax) * 100
	}

	c.JSON(http.StatusOK, gin.H{
		"grades": grades,
		"summary": gin.H{
			"total_subjects": len(grades),
			"average":        average,
		},
	})
}

// getChildAttendance - Get attendance for a specific child
func getChildAttendance(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)
	userID := c.MustGet("userID").(uint)
	studentID := c.Param("studentId")
	month := c.Query("month")

	// Verify parent-child relationship
	var link models.ParentStudent
	if err := models.DB.Where("parent_id = ? AND student_id = ?", userID, studentID).First(&link).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized to view this student"})
		return
	}

	query := models.DB.Where("student_id = ? AND school_id = ?", studentID, schoolID)

	if month != "" {
		// Parse YYYY-MM format
		query = query.Where("strftime('%Y-%m', date) = ?", month)
	}

	var records []models.Attendance
	query.Order("date DESC").Find(&records)

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

// getChildFees - Get fee balance for a specific child
func getChildFees(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)
	userID := c.MustGet("userID").(uint)
	studentID := c.Param("studentId")

	// Verify parent-child relationship
	var link models.ParentStudent
	if err := models.DB.Where("parent_id = ? AND student_id = ?", userID, studentID).First(&link).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized to view this student"})
		return
	}

	var student models.Student
	if err := models.DB.Where("id = ? AND school_id = ?", studentID, schoolID).
		Preload("Class").First(&student).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Student not found"})
		return
	}

	// Calculate fees
	var totalFees float64
	if student.ClassID != nil {
		models.DB.Model(&models.FeeStructure{}).
			Where("class_id = ? AND school_id = ?", *student.ClassID, schoolID).
			Select("COALESCE(SUM(amount), 0)").
			Scan(&totalFees)
	}

	var totalPayments float64
	models.DB.Model(&models.Payment{}).
		Where("student_id = ? AND school_id = ?", student.ID, schoolID).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&totalPayments)

	// Recent payments
	var recentPayments []models.Payment
	models.DB.Where("student_id = ? AND school_id = ?", student.ID, schoolID).
		Order("created_at DESC").
		Limit(5).
		Find(&recentPayments)

	c.JSON(http.StatusOK, gin.H{
		"total_fees":      totalFees,
		"total_payments":  totalPayments,
		"balance":         totalFees - totalPayments,
		"recent_payments": recentPayments,
	})
}

// getParentDashboard - Aggregated dashboard data for all children
func getParentDashboard(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)
	userID := c.MustGet("userID").(uint)

	var links []models.ParentStudent
	models.DB.Where("parent_id = ?", userID).
		Preload("Student").
		Preload("Student.User").
		Preload("Student.Class").
		Find(&links)

	var children []gin.H
	for _, link := range links {
		if link.Student.SchoolID != schoolID {
			continue
		}

		student := link.Student

		// Get latest grades
		var grades []models.Grade
		models.DB.Where("student_id = ?", student.ID).
			Order("created_at DESC").
			Limit(3).
			Find(&grades)

		// Get attendance rate (this month)
		var attendance []models.Attendance
		models.DB.Where("student_id = ? AND date >= date('now', 'start of month')", student.ID).
			Find(&attendance)

		present := 0
		for _, a := range attendance {
			if a.Status == "PRESENT" || a.Status == "LATE" {
				present++
			}
		}
		attendanceRate := float64(0)
		if len(attendance) > 0 {
			attendanceRate = float64(present) / float64(len(attendance)) * 100
		}

		// Get fee balance
		var totalFees, totalPayments float64
		if student.ClassID != nil {
			models.DB.Model(&models.FeeStructure{}).
				Where("class_id = ?", *student.ClassID).
				Select("COALESCE(SUM(amount), 0)").
				Scan(&totalFees)
		}
		models.DB.Model(&models.Payment{}).
			Where("student_id = ?", student.ID).
			Select("COALESCE(SUM(amount), 0)").
			Scan(&totalPayments)

		children = append(children, gin.H{
			"id":                student.ID,
			"name":              student.User.FullName,
			"email":             student.User.Email,
			"enrollment_number": student.EnrollmentNumber,
			"class_name":        student.Class.Name,
			"relation":          link.Relation,
			"recent_grades":     grades,
			"attendance_rate":   attendanceRate,
			"fee_balance":       totalFees - totalPayments,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"children":       children,
		"total_children": len(children),
	})
}
