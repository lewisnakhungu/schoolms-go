package routes

import (
	"encoding/csv"
	"io"
	"net/http"
	"schoolms-go/middleware"
	"schoolms-go/models"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

func RegisterImportRoutes(router *gin.RouterGroup) {
	imp := router.Group("/import")
	imp.Use(middleware.AuthMiddleware(), middleware.RoleGuard("SCHOOLADMIN"))
	{
		imp.POST("/students", importStudents)
		imp.POST("/students/preview", previewStudentImport)
	}
}

// ImportRow - Parsed row from CSV/Excel
type ImportRow struct {
	AdmNo          string  `json:"adm_no"`
	Name           string  `json:"name"`
	Email          string  `json:"email"`
	ParentPhone    string  `json:"parent_phone"`
	ClassName      string  `json:"class_name"`
	CurrentBalance float64 `json:"current_balance"`
	Error          string  `json:"error,omitempty"`
	RowNum         int     `json:"row_num"`
}

// ImportResult - Result of import operation
type ImportResult struct {
	TotalRows int         `json:"total_rows"`
	Imported  int         `json:"imported"`
	Skipped   int         `json:"skipped"`
	Errors    []ImportRow `json:"errors"`
}

func previewStudentImport(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)

	file, _, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}
	defer file.Close()

	rows, parseErr := parseCSV(file)
	if parseErr != "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": parseErr})
		return
	}

	// Validate rows
	validRows, errorRows := validateImportRows(rows, schoolID)

	c.JSON(http.StatusOK, gin.H{
		"total":      len(rows),
		"valid":      len(validRows),
		"errors":     len(errorRows),
		"preview":    validRows[:min(10, len(validRows))],
		"error_rows": errorRows,
	})
}

func importStudents(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)

	file, _, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}
	defer file.Close()

	rows, parseErr := parseCSV(file)
	if parseErr != "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": parseErr})
		return
	}

	validRows, errorRows := validateImportRows(rows, schoolID)

	result := ImportResult{
		TotalRows: len(rows),
		Errors:    errorRows,
	}

	// Get or create classes map
	classMap := make(map[string]uint)
	var classes []models.Class
	models.DB.Where("school_id = ?", schoolID).Find(&classes)
	for _, cl := range classes {
		classMap[strings.ToLower(cl.Name)] = cl.ID
	}

	// Import each valid row
	for _, row := range validRows {
		// Check for duplicate admission number
		var existing models.Student
		if err := models.DB.Where("enrollment_number = ? AND school_id = ?", row.AdmNo, schoolID).First(&existing).Error; err == nil {
			row.Error = "Duplicate admission number"
			result.Errors = append(result.Errors, row)
			result.Skipped++
			continue
		}

		// Create user
		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("changeme123"), bcrypt.DefaultCost)
		user := models.User{
			Email:        row.Email,
			PasswordHash: string(hashedPassword),
			Role:         "STUDENT",
			SchoolID:     &schoolID,
		}
		if err := models.DB.Create(&user).Error; err != nil {
			row.Error = "Failed to create user: " + err.Error()
			result.Errors = append(result.Errors, row)
			result.Skipped++
			continue
		}

		// Find class
		var classID *uint
		if row.ClassName != "" {
			if cid, ok := classMap[strings.ToLower(row.ClassName)]; ok {
				classID = &cid
			}
		}

		// Create student
		student := models.Student{
			UserID:           user.ID,
			SchoolID:         schoolID,
			EnrollmentNumber: row.AdmNo,
			ClassID:          classID,
			Status:           "ACTIVE",
		}
		if err := models.DB.Create(&student).Error; err != nil {
			row.Error = "Failed to create student: " + err.Error()
			result.Errors = append(result.Errors, row)
			result.Skipped++
			continue
		}

		// Create initial balance if provided
		if row.CurrentBalance > 0 {
			// Create a general vote head balance (simplified)
			var voteHead models.VoteHead
			if err := models.DB.Where("school_id = ?", schoolID).Order("priority").First(&voteHead).Error; err == nil {
				balance := models.VoteHeadBalance{
					StudentID:  student.ID,
					VoteHeadID: voteHead.ID,
					SchoolID:   schoolID,
					Balance:    row.CurrentBalance,
				}
				models.DB.Create(&balance)
			}
		}

		result.Imported++
	}

	c.JSON(http.StatusOK, result)
}

func parseCSV(file io.Reader) ([]ImportRow, string) {
	reader := csv.NewReader(file)

	// Read header
	header, err := reader.Read()
	if err != nil {
		return nil, "Failed to read CSV header"
	}

	// Map header columns
	colMap := make(map[string]int)
	for i, col := range header {
		colMap[strings.ToLower(strings.TrimSpace(col))] = i
	}

	// Required columns
	requiredCols := []string{"adm_no", "name"}
	for _, col := range requiredCols {
		// Check variations
		found := false
		variations := []string{col, strings.ReplaceAll(col, "_", ""), strings.ReplaceAll(col, "_", " ")}
		for _, v := range variations {
			if _, ok := colMap[v]; ok {
				found = true
				break
			}
		}
		if !found {
			return nil, "Missing required column: " + col
		}
	}

	// Parse rows
	var rows []ImportRow
	rowNum := 1

	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			continue
		}
		rowNum++

		row := ImportRow{RowNum: rowNum}

		// Get values with column name variations
		row.AdmNo = getColValue(record, colMap, "adm_no", "admno", "admission_number", "admission")
		row.Name = getColValue(record, colMap, "name", "student_name", "full_name")
		row.Email = getColValue(record, colMap, "email", "e-mail")
		row.ParentPhone = getColValue(record, colMap, "parent_phone", "parentphone", "phone", "guardian_phone")
		row.ClassName = getColValue(record, colMap, "class", "class_name", "form", "grade")

		balStr := getColValue(record, colMap, "balance", "current_balance", "fee_balance")
		if balStr != "" {
			row.CurrentBalance, _ = strconv.ParseFloat(strings.ReplaceAll(balStr, ",", ""), 64)
		}

		// Generate email if not provided
		if row.Email == "" && row.AdmNo != "" {
			row.Email = strings.ToLower(strings.ReplaceAll(row.AdmNo, "/", "")) + "@student.local"
		}

		rows = append(rows, row)
	}

	return rows, ""
}

func getColValue(record []string, colMap map[string]int, variations ...string) string {
	for _, v := range variations {
		if idx, ok := colMap[strings.ToLower(v)]; ok && idx < len(record) {
			return strings.TrimSpace(record[idx])
		}
	}
	return ""
}

func validateImportRows(rows []ImportRow, schoolID uint) ([]ImportRow, []ImportRow) {
	var valid, errors []ImportRow

	for _, row := range rows {
		if row.AdmNo == "" {
			row.Error = "Missing admission number"
			errors = append(errors, row)
			continue
		}
		if row.Name == "" {
			row.Error = "Missing name"
			errors = append(errors, row)
			continue
		}

		valid = append(valid, row)
	}

	return valid, errors
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
