package routes

import (
	"net/http"
	"schoolms-go/middleware"
	"schoolms-go/models"

	"github.com/gin-gonic/gin"
)

// RegisterParentLinkRoutes - Admin routes for linking parents to students
func RegisterParentLinkRoutes(router *gin.RouterGroup) {
	links := router.Group("/parent-links")
	links.Use(middleware.AuthMiddleware(), middleware.RoleGuard("SCHOOLADMIN"))
	{
		links.POST("", createParentLink)
		links.GET("", listParentLinks)
		links.DELETE("/:id", deleteParentLink)
		links.GET("/student/:studentId", getStudentParents)
	}
}

type ParentLinkInput struct {
	ParentID  uint   `json:"parent_id" binding:"required"`
	StudentID uint   `json:"student_id" binding:"required"`
	Relation  string `json:"relation"` // FATHER, MOTHER, GUARDIAN
}

func createParentLink(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)

	var input ParentLinkInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify parent user exists with PARENT role
	var parent models.User
	if err := models.DB.Where("id = ? AND role = ? AND school_id = ?", input.ParentID, "PARENT", schoolID).First(&parent).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Parent user not found"})
		return
	}

	// Verify student exists
	var student models.Student
	if err := models.DB.Where("id = ? AND school_id = ?", input.StudentID, schoolID).First(&student).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Student not found"})
		return
	}

	// Check if link already exists
	var existing models.ParentStudent
	if err := models.DB.Where("parent_id = ? AND student_id = ?", input.ParentID, input.StudentID).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Link already exists"})
		return
	}

	relation := input.Relation
	if relation == "" {
		relation = "GUARDIAN"
	}

	link := models.ParentStudent{
		ParentID:  input.ParentID,
		StudentID: input.StudentID,
		Relation:  relation,
	}

	if err := models.DB.Create(&link).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create link"})
		return
	}

	c.JSON(http.StatusCreated, link)
}

func listParentLinks(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)

	var links []models.ParentStudent
	models.DB.Joins("JOIN students ON students.id = parent_students.student_id").
		Where("students.school_id = ?", schoolID).
		Preload("Parent").
		Preload("Student").
		Preload("Student.User").
		Find(&links)

	c.JSON(http.StatusOK, links)
}

func deleteParentLink(c *gin.Context) {
	id := c.Param("id")

	result := models.DB.Delete(&models.ParentStudent{}, id)
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Link not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Link removed"})
}

func getStudentParents(c *gin.Context) {
	studentID := c.Param("studentId")

	var links []models.ParentStudent
	models.DB.Where("student_id = ?", studentID).
		Preload("Parent").
		Find(&links)

	c.JSON(http.StatusOK, links)
}
