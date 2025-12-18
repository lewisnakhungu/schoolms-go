package routes

import (
	"html/template"
	"net/http"
	"schoolms-go/middleware"
	"schoolms-go/models"

	"github.com/gin-gonic/gin"
)

type Defaulter struct {
	StudentName      string
	EnrollmentNumber string
	Class            string
	Balance          float64
}

func RegisterReportRoutes(router *gin.RouterGroup) {
	reports := router.Group("/reports")
	reports.Use(middleware.AuthMiddleware(), middleware.RoleGuard("SCHOOLADMIN"))
	{
		reports.GET("/defaulters", listDefaulters)
		reports.GET("/defaulters/print", printDefaulters)
	}
}

func getDefaultersData(schoolID uint) ([]Defaulter, error) {
	// Complex query: Join Students, Balance calculation...
	// For MVP, we'll iterate locally or do a simpler query.
	// SQL approach is better for performance.
	// SELECT student attributes, (SUM(fees) - SUM(payments)) as balance
	// This requires joining fee_structures on class_id and payments on student_id
	// GORM raw SQL might be easiest here.

	query := `
		SELECT 
			u.full_name as student_name,
			s.enrollment_number,
			c.name as class,
			(
				COALESCE((SELECT SUM(amount) FROM fee_structures fs WHERE fs.class_id = s.class_id), 0) - 
				COALESCE((SELECT SUM(amount) FROM payments p WHERE p.student_id = s.id), 0)
			) as balance
		FROM students s
		JOIN users u ON u.id = s.user_id
		LEFT JOIN classes c ON c.id = s.class_id
		WHERE s.school_id = ?
	`
	// Note: In Postgres, "users u" needs schema qualification if not simple? No, standard SQL.
	// But "u.full_name" - wait, my User model doesn't have FullName anymore! It has Email.
	// I removed FullName in Phase 1 per requirements.
	// I'll scope it to Email for now.

	query = `
		SELECT 
			u.email as student_name,
			s.enrollment_number,
			c.name as class,
			(
				COALESCE((SELECT SUM(amount) FROM fee_structures fs WHERE fs.class_id = s.class_id), 0) - 
				COALESCE((SELECT SUM(amount) FROM payments p WHERE p.student_id = s.id), 0)
			) as balance
		FROM students s
		JOIN users u ON u.id = s.user_id
		LEFT JOIN classes c ON c.id = s.class_id
		WHERE s.school_id = ?
	`

	var results []Defaulter
	if err := models.DB.Raw(query, schoolID).Scan(&results).Error; err != nil {
		return nil, err
	}

	// Filter balance > 0 in app (or SQLHAVING balance > 0)
	var defaulters []Defaulter
	for _, r := range results {
		if r.Balance > 0 {
			defaulters = append(defaulters, r)
		}
	}

	return defaulters, nil
}

func listDefaulters(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)

	defaulters, err := getDefaultersData(schoolID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, defaulters)
}

func printDefaulters(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)

	defaulters, err := getDefaultersData(schoolID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Simple HTML template
	const tpl = `
	<!DOCTYPE html>
	<html>
	<head>
		<title>Defaulters Report</title>
		<style>
			body { font-family: sans-serif; }
			table { width: 100%; border-collapse: collapse; }
			th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
			th { background-color: #f2f2f2; }
		</style>
	</head>
	<body>
		<h2>Defaulters Report</h2>
		<table>
			<tr>
				<th>Student (Email)</th>
				<th>Enrollment #</th>
				<th>Class</th>
				<th>Balance</th>
			</tr>
			{{range .}}
			<tr>
				<td>{{.StudentName}}</td>
				<td>{{.EnrollmentNumber}}</td>
				<td>{{.Class}}</td>
				<td>{{.Balance}}</td>
			</tr>
			{{end}}
		</table>
	</body>
	</html>
	`

	t, err := template.New("report").Parse(tpl)
	if err != nil {
		c.String(http.StatusInternalServerError, "Template error")
		return
	}

	c.Header("Content-Type", "text/html")
	t.Execute(c.Writer, defaulters)
}
