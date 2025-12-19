package routes

import (
	"net/http"
	"schoolms-go/middleware"
	"schoolms-go/models"
	"time"

	"github.com/gin-gonic/gin"
)

func RegisterAnalyticsRoutes(router *gin.RouterGroup) {
	analytics := router.Group("/analytics")
	analytics.Use(middleware.AuthMiddleware(), middleware.RoleGuard("SCHOOLADMIN", "FINANCE"))
	{
		analytics.GET("/dashboard", getDashboardAnalytics)
		analytics.GET("/enrollment", getEnrollmentTrends)
		analytics.GET("/finance", getFinanceAnalytics)
		analytics.GET("/attendance", getAttendanceAnalytics)
	}
}

func getDashboardAnalytics(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)

	// Counts
	var totalStudents, totalTeachers, totalClasses int64
	models.DB.Model(&models.Student{}).Where("school_id = ?", schoolID).Count(&totalStudents)
	models.DB.Model(&models.User{}).Where("school_id = ? AND role = ?", schoolID, "TEACHER").Count(&totalTeachers)
	models.DB.Model(&models.Class{}).Where("school_id = ?", schoolID).Count(&totalClasses)

	// This month's enrollment
	thisMonth := time.Now().Format("2006-01")
	var newStudents int64
	models.DB.Model(&models.Student{}).
		Where("school_id = ? AND strftime('%Y-%m', created_at) = ?", schoolID, thisMonth).
		Count(&newStudents)

	// Student status breakdown
	var active, pending, discharged int64
	models.DB.Model(&models.Student{}).Where("school_id = ? AND status = ?", schoolID, "ACTIVE").Count(&active)
	models.DB.Model(&models.Student{}).Where("school_id = ? AND status = ?", schoolID, "PENDING").Count(&pending)
	models.DB.Model(&models.Student{}).Where("school_id = ? AND status = ?", schoolID, "DISCHARGED").Count(&discharged)

	// Fee collection
	var totalFees, totalPayments float64
	models.DB.Model(&models.FeeStructure{}).Where("school_id = ?", schoolID).
		Select("COALESCE(SUM(amount), 0)").Scan(&totalFees)
	models.DB.Model(&models.Payment{}).Where("school_id = ?", schoolID).
		Select("COALESCE(SUM(amount), 0)").Scan(&totalPayments)

	collectionRate := float64(0)
	if totalFees > 0 {
		collectionRate = (totalPayments / totalFees) * 100
	}

	c.JSON(http.StatusOK, gin.H{
		"students":       totalStudents,
		"teachers":       totalTeachers,
		"classes":        totalClasses,
		"new_this_month": newStudents,
		"student_status": gin.H{
			"active":     active,
			"pending":    pending,
			"discharged": discharged,
		},
		"finance": gin.H{
			"total_fees":      totalFees,
			"total_payments":  totalPayments,
			"collection_rate": collectionRate,
		},
	})
}

func getEnrollmentTrends(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)

	// Last 6 months enrollment
	months := make([]gin.H, 6)
	now := time.Now()

	for i := 5; i >= 0; i-- {
		month := now.AddDate(0, -i, 0)
		monthStr := month.Format("2006-01")
		label := month.Format("Jan")

		var count int64
		models.DB.Model(&models.Student{}).
			Where("school_id = ? AND strftime('%Y-%m', created_at) = ?", schoolID, monthStr).
			Count(&count)

		months[5-i] = gin.H{
			"month": label,
			"count": count,
		}
	}

	c.JSON(http.StatusOK, months)
}

func getFinanceAnalytics(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)

	// Monthly payments for last 6 months
	months := make([]gin.H, 6)
	now := time.Now()

	for i := 5; i >= 0; i-- {
		month := now.AddDate(0, -i, 0)
		monthStr := month.Format("2006-01")
		label := month.Format("Jan")

		var amount float64
		models.DB.Model(&models.Payment{}).
			Where("school_id = ? AND strftime('%Y-%m', created_at) = ?", schoolID, monthStr).
			Select("COALESCE(SUM(amount), 0)").Scan(&amount)

		months[5-i] = gin.H{
			"month":  label,
			"amount": amount,
		}
	}

	c.JSON(http.StatusOK, months)
}

func getAttendanceAnalytics(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)

	// This week's attendance
	today := time.Now()
	weekStart := today.AddDate(0, 0, -int(today.Weekday()))

	var present, absent, late int64
	models.DB.Model(&models.Attendance{}).
		Where("school_id = ? AND date >= ? AND status = ?", schoolID, weekStart, "PRESENT").Count(&present)
	models.DB.Model(&models.Attendance{}).
		Where("school_id = ? AND date >= ? AND status = ?", schoolID, weekStart, "ABSENT").Count(&absent)
	models.DB.Model(&models.Attendance{}).
		Where("school_id = ? AND date >= ? AND status = ?", schoolID, weekStart, "LATE").Count(&late)

	total := present + absent + late
	rate := float64(0)
	if total > 0 {
		rate = float64(present+late) / float64(total) * 100
	}

	// Daily breakdown for this week
	days := make([]gin.H, 5)
	for i := 0; i < 5; i++ {
		day := weekStart.AddDate(0, 0, i+1) // Monday to Friday
		dayStr := day.Format("2006-01-02")
		label := day.Format("Mon")

		var dayPresent int64
		models.DB.Model(&models.Attendance{}).
			Where("school_id = ? AND date = ? AND (status = ? OR status = ?)", schoolID, dayStr, "PRESENT", "LATE").
			Count(&dayPresent)

		var dayTotal int64
		models.DB.Model(&models.Attendance{}).
			Where("school_id = ? AND date = ?", schoolID, dayStr).
			Count(&dayTotal)

		dayRate := float64(0)
		if dayTotal > 0 {
			dayRate = float64(dayPresent) / float64(dayTotal) * 100
		}

		days[i] = gin.H{
			"day":  label,
			"rate": dayRate,
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"week_summary": gin.H{
			"present": present,
			"absent":  absent,
			"late":    late,
			"rate":    rate,
		},
		"daily": days,
	})
}
