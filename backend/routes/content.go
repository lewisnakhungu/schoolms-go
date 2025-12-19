package routes

import (
	"net/http"
	"os"
	"path/filepath"
	"schoolms-go/middleware"
	"schoolms-go/models"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func RegisterContentRoutes(router *gin.RouterGroup) {
	content := router.Group("/content")
	content.Use(middleware.AuthMiddleware())
	{
		// Teacher routes
		content.POST("/classes/:classId", middleware.RoleGuard("TEACHER", "SCHOOLADMIN"), uploadContent)
		content.GET("/classes/:classId", getClassContent)
		content.DELETE("/:id", middleware.RoleGuard("TEACHER", "SCHOOLADMIN"), deleteContent)
	}
}

// uploadContent - Teacher uploads content to their class
func uploadContent(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)
	userID := c.MustGet("userID").(uint)
	classID, err := strconv.ParseUint(c.Param("classId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid class ID"})
		return
	}

	// Verify teacher owns this class
	var class models.Class
	if err := models.DB.Where("id = ? AND school_id = ?", classID, schoolID).First(&class).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Class not found"})
		return
	}

	// Check if teacher is assigned to this class (unless admin)
	role := c.MustGet("role").(string)
	if role == "TEACHER" && (class.TeacherID == nil || *class.TeacherID != userID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "You are not assigned to this class"})
		return
	}

	contentType := c.PostForm("content_type")
	title := c.PostForm("title")
	description := c.PostForm("description")
	textContent := c.PostForm("text_content")

	if title == "" || contentType == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Title and content type are required"})
		return
	}

	content := models.ClassContent{
		ClassID:     uint(classID),
		TeacherID:   userID,
		Title:       title,
		Description: description,
		ContentType: contentType,
		TextContent: textContent,
	}

	// Handle file upload
	if contentType != "NOTE" && contentType != "LINK" {
		file, err := c.FormFile("file")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "File is required for this content type"})
			return
		}

		// Create uploads directory
		uploadDir := "./uploads"
		if err := os.MkdirAll(uploadDir, 0755); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
			return
		}

		// Generate unique filename
		ext := filepath.Ext(file.Filename)
		newFilename := uuid.New().String() + ext
		filePath := filepath.Join(uploadDir, newFilename)

		// Save file
		if err := c.SaveUploadedFile(file, filePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
			return
		}

		content.FileURL = "/uploads/" + newFilename
		content.FileName = file.Filename
		content.FileSize = file.Size
	}

	if err := models.DB.Create(&content).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create content"})
		return
	}

	c.JSON(http.StatusCreated, content)
}

// getClassContent - Get all content for a class
func getClassContent(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)
	classID := c.Param("classId")

	// Verify class exists and belongs to school
	var class models.Class
	if err := models.DB.Where("id = ? AND school_id = ?", classID, schoolID).First(&class).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Class not found"})
		return
	}

	var contents []models.ClassContent
	models.DB.Where("class_id = ?", classID).
		Preload("Teacher").
		Order("created_at DESC").
		Find(&contents)

	c.JSON(http.StatusOK, contents)
}

// deleteContent - Delete content (teacher or admin)
func deleteContent(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	role := c.MustGet("role").(string)
	contentID := c.Param("id")

	var content models.ClassContent
	if err := models.DB.First(&content, contentID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Content not found"})
		return
	}

	// Only allow deletion by content owner or admin
	if role == "TEACHER" && content.TeacherID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only delete your own content"})
		return
	}

	// Delete file if exists
	if content.FileURL != "" {
		filePath := "." + content.FileURL
		os.Remove(filePath)
	}

	if err := models.DB.Delete(&content).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete content"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Content deleted successfully"})
}

// RegisterGradeRoutes - Grade management routes
func RegisterGradeRoutes(router *gin.RouterGroup) {
	grades := router.Group("/grades")
	grades.Use(middleware.AuthMiddleware())
	{
		// Teacher creates/updates grades
		grades.POST("", middleware.RoleGuard("TEACHER", "SCHOOLADMIN"), createGrade)
		grades.POST("/bulk", middleware.RoleGuard("TEACHER", "SCHOOLADMIN"), createBulkGrades)
		grades.GET("/class/:classId", middleware.RoleGuard("TEACHER", "SCHOOLADMIN"), getClassGrades)

		// Student views their own grades
		grades.GET("/my", middleware.RoleGuard("STUDENT"), getMyGrades)
	}
}

type GradeInput struct {
	StudentID uint    `json:"student_id" binding:"required"`
	ClassID   uint    `json:"class_id" binding:"required"`
	Subject   string  `json:"subject" binding:"required"`
	Score     float64 `json:"score" binding:"required"`
	MaxScore  float64 `json:"max_score"`
	Term      string  `json:"term"`
	Year      int     `json:"year"`
	Comment   string  `json:"comment"`
}

func createGrade(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)

	var input GradeInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.MaxScore == 0 {
		input.MaxScore = 100
	}
	if input.Year == 0 {
		input.Year = time.Now().Year()
	}

	grade := models.Grade{
		StudentID: input.StudentID,
		ClassID:   input.ClassID,
		SchoolID:  schoolID,
		Subject:   input.Subject,
		Score:     input.Score,
		MaxScore:  input.MaxScore,
		Term:      input.Term,
		Year:      input.Year,
		Comment:   input.Comment,
	}

	if err := models.DB.Create(&grade).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create grade"})
		return
	}

	c.JSON(http.StatusCreated, grade)
}

func createBulkGrades(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)

	var inputs []GradeInput
	if err := c.ShouldBindJSON(&inputs); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	grades := make([]models.Grade, len(inputs))
	for i, input := range inputs {
		if input.MaxScore == 0 {
			input.MaxScore = 100
		}
		if input.Year == 0 {
			input.Year = time.Now().Year()
		}
		grades[i] = models.Grade{
			StudentID: input.StudentID,
			ClassID:   input.ClassID,
			SchoolID:  schoolID,
			Subject:   input.Subject,
			Score:     input.Score,
			MaxScore:  input.MaxScore,
			Term:      input.Term,
			Year:      input.Year,
			Comment:   input.Comment,
		}
	}

	if err := models.DB.Create(&grades).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create grades"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Grades created successfully",
		"count":   len(grades),
	})
}

func getClassGrades(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)
	classID := c.Param("classId")
	term := c.Query("term")
	year := c.Query("year")

	query := models.DB.Where("class_id = ? AND school_id = ?", classID, schoolID).
		Preload("Student").Preload("Student.User")

	if term != "" {
		query = query.Where("term = ?", term)
	}
	if year != "" {
		query = query.Where("year = ?", year)
	}

	var grades []models.Grade
	query.Order("subject, student_id").Find(&grades)

	c.JSON(http.StatusOK, grades)
}

func getMyGrades(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)
	userID := c.MustGet("userID").(uint)

	// Find student by user ID
	var student models.Student
	if err := models.DB.Where("user_id = ? AND school_id = ?", userID, schoolID).First(&student).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Student not found"})
		return
	}

	var grades []models.Grade
	models.DB.Where("student_id = ? AND school_id = ?", student.ID, schoolID).
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
