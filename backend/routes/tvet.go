package routes

import (
	"net/http"
	"schoolms-go/middleware"
	"schoolms-go/models"

	"github.com/gin-gonic/gin"
)

func RegisterTVETRoutes(router *gin.RouterGroup) {
	tvet := router.Group("/tvet")
	tvet.Use(middleware.AuthMiddleware())
	{
		// Intake Groups
		tvet.POST("/intakes", middleware.RoleGuard("SCHOOLADMIN"), createIntake)
		tvet.GET("/intakes", middleware.RoleGuard("SCHOOLADMIN", "TEACHER"), listIntakes)
		tvet.PUT("/intakes/:id", middleware.RoleGuard("SCHOOLADMIN"), updateIntake)

		// Courses
		tvet.POST("/courses", middleware.RoleGuard("SCHOOLADMIN"), createCourse)
		tvet.GET("/courses", listCourses)
		tvet.PUT("/courses/:id", middleware.RoleGuard("SCHOOLADMIN"), updateCourse)

		// Modules
		tvet.POST("/modules", middleware.RoleGuard("SCHOOLADMIN"), createModule)
		tvet.GET("/courses/:courseId/modules", getModulesByCourse)

		// Industrial Attachments
		tvet.POST("/attachments", middleware.RoleGuard("SCHOOLADMIN", "TEACHER"), createAttachment)
		tvet.GET("/attachments", middleware.RoleGuard("SCHOOLADMIN", "TEACHER"), listAttachments)
		tvet.GET("/attachments/:id", getAttachment)
		tvet.PUT("/attachments/:id", middleware.RoleGuard("SCHOOLADMIN", "TEACHER"), updateAttachment)
		tvet.GET("/students/:studentId/attachments", getStudentAttachments)
	}
}

// --- Intake Groups ---

type CreateIntakeInput struct {
	Name      string `json:"name" binding:"required"`
	StartDate string `json:"start_date"`
	EndDate   string `json:"end_date"`
}

func createIntake(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)

	var input CreateIntakeInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	intake := models.IntakeGroup{
		SchoolID: schoolID,
		Name:     input.Name,
		IsActive: true,
	}

	// Parse dates if provided
	// (simplified - in production use proper date parsing)

	if err := models.DB.Create(&intake).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create intake"})
		return
	}

	c.JSON(http.StatusCreated, intake)
}

func listIntakes(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)

	var intakes []models.IntakeGroup
	models.DB.Where("school_id = ?", schoolID).Order("start_date DESC").Find(&intakes)

	c.JSON(http.StatusOK, intakes)
}

func updateIntake(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)
	id := c.Param("id")

	var intake models.IntakeGroup
	if err := models.DB.Where("id = ? AND school_id = ?", id, schoolID).First(&intake).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Intake not found"})
		return
	}

	var input CreateIntakeInput
	c.ShouldBindJSON(&input)

	if input.Name != "" {
		intake.Name = input.Name
	}

	models.DB.Save(&intake)
	c.JSON(http.StatusOK, intake)
}

// --- Courses ---

type CreateCourseInput struct {
	Name           string `json:"name" binding:"required"`
	Code           string `json:"code"`
	DurationMonths int    `json:"duration_months"`
	Level          string `json:"level"` // Certificate, Diploma, Higher Diploma
}

func createCourse(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)

	var input CreateCourseInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	course := models.Course{
		SchoolID:       schoolID,
		Name:           input.Name,
		Code:           input.Code,
		DurationMonths: input.DurationMonths,
		Level:          input.Level,
		IsActive:       true,
	}

	if err := models.DB.Create(&course).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create course"})
		return
	}

	c.JSON(http.StatusCreated, course)
}

func listCourses(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)

	var courses []models.Course
	models.DB.Where("school_id = ?", schoolID).Order("name").Find(&courses)

	c.JSON(http.StatusOK, courses)
}

func updateCourse(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)
	id := c.Param("id")

	var course models.Course
	if err := models.DB.Where("id = ? AND school_id = ?", id, schoolID).First(&course).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Course not found"})
		return
	}

	var input CreateCourseInput
	c.ShouldBindJSON(&input)

	if input.Name != "" {
		course.Name = input.Name
	}
	if input.Code != "" {
		course.Code = input.Code
	}
	if input.DurationMonths > 0 {
		course.DurationMonths = input.DurationMonths
	}
	if input.Level != "" {
		course.Level = input.Level
	}

	models.DB.Save(&course)
	c.JSON(http.StatusOK, course)
}

// --- Modules ---

type CreateModuleInput struct {
	CourseID    uint   `json:"course_id" binding:"required"`
	Name        string `json:"name" binding:"required"`
	Code        string `json:"code"`
	KNECCode    string `json:"knec_code"`
	CreditHours int    `json:"credit_hours"`
}

func createModule(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)

	var input CreateModuleInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	module := models.Module{
		CourseID:    input.CourseID,
		SchoolID:    schoolID,
		Name:        input.Name,
		Code:        input.Code,
		KNECCode:    input.KNECCode,
		CreditHours: input.CreditHours,
		IsActive:    true,
	}

	if err := models.DB.Create(&module).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create module"})
		return
	}

	c.JSON(http.StatusCreated, module)
}

func getModulesByCourse(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)
	courseID := c.Param("courseId")

	var modules []models.Module
	models.DB.Where("course_id = ? AND school_id = ?", courseID, schoolID).Order("name").Find(&modules)

	c.JSON(http.StatusOK, modules)
}

// --- Industrial Attachments ---

type CreateAttachmentInput struct {
	StudentID       uint   `json:"student_id" binding:"required"`
	CompanyName     string `json:"company_name" binding:"required"`
	CompanyAddress  string `json:"company_address"`
	SupervisorName  string `json:"supervisor_name"`
	SupervisorPhone string `json:"supervisor_phone"`
	StartDate       string `json:"start_date"`
	DurationWeeks   int    `json:"duration_weeks"`
}

func createAttachment(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)

	var input CreateAttachmentInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	attachment := models.IndustrialAttachment{
		StudentID:       input.StudentID,
		SchoolID:        schoolID,
		CompanyName:     input.CompanyName,
		CompanyAddress:  input.CompanyAddress,
		SupervisorName:  input.SupervisorName,
		SupervisorPhone: input.SupervisorPhone,
		DurationWeeks:   input.DurationWeeks,
		Status:          "PLANNED",
	}

	if err := models.DB.Create(&attachment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create attachment"})
		return
	}

	c.JSON(http.StatusCreated, attachment)
}

func listAttachments(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)
	status := c.Query("status")

	query := models.DB.Where("school_id = ?", schoolID)
	if status != "" {
		query = query.Where("status = ?", status)
	}

	var attachments []models.IndustrialAttachment
	query.Preload("Student").Order("start_date DESC").Find(&attachments)

	c.JSON(http.StatusOK, attachments)
}

func getAttachment(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)
	id := c.Param("id")

	var attachment models.IndustrialAttachment
	if err := models.DB.Where("id = ? AND school_id = ?", id, schoolID).
		Preload("Student").First(&attachment).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Attachment not found"})
		return
	}

	c.JSON(http.StatusOK, attachment)
}

func updateAttachment(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)
	id := c.Param("id")

	var attachment models.IndustrialAttachment
	if err := models.DB.Where("id = ? AND school_id = ?", id, schoolID).First(&attachment).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Attachment not found"})
		return
	}

	var input struct {
		Status          string `json:"status"`
		LogbookGrade    string `json:"logbook_grade"`
		SupervisorGrade string `json:"supervisor_grade"`
		FinalGrade      string `json:"final_grade"`
		Notes           string `json:"notes"`
	}
	c.ShouldBindJSON(&input)

	if input.Status != "" {
		attachment.Status = input.Status
	}
	if input.LogbookGrade != "" {
		attachment.LogbookGrade = input.LogbookGrade
	}
	if input.SupervisorGrade != "" {
		attachment.SupervisorGrade = input.SupervisorGrade
	}
	if input.FinalGrade != "" {
		attachment.FinalGrade = input.FinalGrade
	}
	if input.Notes != "" {
		attachment.Notes = input.Notes
	}

	models.DB.Save(&attachment)
	c.JSON(http.StatusOK, attachment)
}

func getStudentAttachments(c *gin.Context) {
	schoolID := c.MustGet("schoolID").(uint)
	studentID := c.Param("studentId")

	var attachments []models.IndustrialAttachment
	models.DB.Where("student_id = ? AND school_id = ?", studentID, schoolID).
		Order("start_date DESC").Find(&attachments)

	c.JSON(http.StatusOK, attachments)
}
