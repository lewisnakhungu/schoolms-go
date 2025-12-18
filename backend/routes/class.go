package routes

import (
	"net/http"
	"schoolms-go/middleware"
	"schoolms-go/models"

	"github.com/gin-gonic/gin"
)

type CreateClassInput struct {
	Name      string `json:"name" binding:"required"`
	TeacherID *uint  `json:"teacher_id"`
}

func RegisterClassRoutes(router *gin.RouterGroup) {
	classes := router.Group("/classes")
	classes.Use(middleware.AuthMiddleware(), middleware.RoleGuard("SCHOOLADMIN")) // Only admins manage classes
	{
		classes.POST("", createClass)
		classes.GET("", listClasses)
	}
}

func createClass(c *gin.Context) {
	schoolIDVal, exists := c.Get("schoolID")
	if !exists {
		c.JSON(http.StatusForbidden, gin.H{"error": "School scope required"})
		return
	}
	schoolID := schoolIDVal.(uint)

	var input CreateClassInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	class := models.Class{
		Name:      input.Name,
		SchoolID:  schoolID,
		TeacherID: input.TeacherID,
	}

	if err := models.DB.Create(&class).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create class"})
		return
	}

	c.JSON(http.StatusCreated, class)
}

func listClasses(c *gin.Context) {
	schoolIDVal, exists := c.Get("schoolID")
	if !exists {
		c.JSON(http.StatusForbidden, gin.H{"error": "School scope required"})
		return
	}
	schoolID := schoolIDVal.(uint)

	var classes []models.Class
	models.DB.Where("school_id = ?", schoolID).Preload("Teacher").Find(&classes)

	c.JSON(http.StatusOK, classes)
}
