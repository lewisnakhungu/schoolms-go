package routes

import (
	"net/http"
	"schoolms-go/middleware"
	"schoolms-go/models"

	"github.com/gin-gonic/gin"
)

func RegisterTimetableRoutes(router *gin.RouterGroup) {
	timetable := router.Group("/timetable")
	timetable.Use(middleware.AuthMiddleware())
	{
		// Admin manages timetable
		timetable.POST("", middleware.RoleGuard("SCHOOLADMIN"), createTimetableEntry)
		timetable.PUT("/:id", middleware.RoleGuard("SCHOOLADMIN"), updateTimetableEntry)
		timetable.DELETE("/:id", middleware.RoleGuard("SCHOOLADMIN"), deleteTimetableEntry)

		// Everyone can view
		timetable.GET("/class/:classId", middleware.RoleGuard("SCHOOLADMIN", "TEACHER", "STUDENT", "PARENT"), getClassTimetable)
		timetable.GET("/teacher", middleware.RoleGuard("TEACHER"), getTeacherTimetable)
	}
}

type TimetableInput struct {
	ClassID   uint   `json:"class_id" binding:"required"`
	DayOfWeek int    `json:"day_of_week" binding:"required,min=0,max=6"`
	StartTime string `json:"start_time" binding:"required"`
	EndTime   string `json:"end_time" binding:"required"`
	Subject   string `json:"subject" binding:"required"`
	TeacherID *uint  `json:"teacher_id"`
	Room      string `json:"room"`
}

func createTimetableEntry(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)

	var input TimetableInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	entry := models.Timetable{
		ClassID:   input.ClassID,
		SchoolID:  schoolID,
		DayOfWeek: input.DayOfWeek,
		StartTime: input.StartTime,
		EndTime:   input.EndTime,
		Subject:   input.Subject,
		TeacherID: input.TeacherID,
		Room:      input.Room,
	}

	if err := models.DB.Create(&entry).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create timetable entry"})
		return
	}

	c.JSON(http.StatusCreated, entry)
}

func updateTimetableEntry(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)
	id := c.Param("id")

	var entry models.Timetable
	if err := models.DB.Where("id = ? AND school_id = ?", id, schoolID).First(&entry).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Entry not found"})
		return
	}

	var input TimetableInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	entry.DayOfWeek = input.DayOfWeek
	entry.StartTime = input.StartTime
	entry.EndTime = input.EndTime
	entry.Subject = input.Subject
	entry.TeacherID = input.TeacherID
	entry.Room = input.Room

	models.DB.Save(&entry)
	c.JSON(http.StatusOK, entry)
}

func deleteTimetableEntry(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)
	id := c.Param("id")

	result := models.DB.Where("id = ? AND school_id = ?", id, schoolID).Delete(&models.Timetable{})
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Entry not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Deleted"})
}

func getClassTimetable(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)
	classID := c.Param("classId")

	var entries []models.Timetable
	models.DB.Where("class_id = ? AND school_id = ?", classID, schoolID).
		Preload("Teacher").
		Order("day_of_week, start_time").
		Find(&entries)

	// Group by day
	days := []string{"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"}
	schedule := make(map[string][]models.Timetable)
	for _, day := range days {
		schedule[day] = []models.Timetable{}
	}
	for _, e := range entries {
		dayName := days[e.DayOfWeek]
		schedule[dayName] = append(schedule[dayName], e)
	}

	c.JSON(http.StatusOK, gin.H{
		"entries":  entries,
		"schedule": schedule,
	})
}

func getTeacherTimetable(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)
	userID := c.MustGet("userID").(uint)

	var entries []models.Timetable
	models.DB.Where("teacher_id = ? AND school_id = ?", userID, schoolID).
		Preload("Class").
		Order("day_of_week, start_time").
		Find(&entries)

	c.JSON(http.StatusOK, entries)
}
