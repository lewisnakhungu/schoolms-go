package services

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"schoolms-go/models"
	"strings"
	"time"
)

// SMSConfig - Africa's Talking configuration
type SMSConfig struct {
	APIKey    string
	Username  string
	ShortCode string
	Env       string // "sandbox" or "production"
}

var smsConfig SMSConfig

func init() {
	smsConfig = SMSConfig{
		APIKey:    os.Getenv("AT_API_KEY"),
		Username:  os.Getenv("AT_USERNAME"),
		ShortCode: os.Getenv("AT_SHORTCODE"),
		Env:       os.Getenv("AT_ENV"),
	}
	if smsConfig.Env == "" {
		smsConfig.Env = "sandbox"
	}
}

// SMSMessage - Single SMS to send
type SMSMessage struct {
	To      string
	Message string
}

// SMSResult - Result of sending SMS
type SMSResult struct {
	Success bool
	Status  string
	Cost    string
	Error   string
}

// SendSMS - Send a single SMS via Africa's Talking
func SendSMS(to, message string) SMSResult {
	if smsConfig.APIKey == "" {
		return SMSResult{Success: false, Error: "SMS not configured"}
	}

	// Format phone number (Kenya format)
	to = formatKenyanPhone(to)
	if to == "" {
		return SMSResult{Success: false, Error: "Invalid phone number"}
	}

	baseURL := "https://api.sandbox.africastalking.com"
	if smsConfig.Env == "production" {
		baseURL = "https://api.africastalking.com"
	}

	data := url.Values{}
	data.Set("username", smsConfig.Username)
	data.Set("to", to)
	data.Set("message", message)
	if smsConfig.ShortCode != "" {
		data.Set("from", smsConfig.ShortCode)
	}

	req, _ := http.NewRequest("POST", baseURL+"/version1/messaging", strings.NewReader(data.Encode()))
	req.Header.Add("Accept", "application/json")
	req.Header.Add("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Add("apiKey", smsConfig.APIKey)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return SMSResult{Success: false, Error: err.Error()}
	}
	defer resp.Body.Close()

	var result struct {
		SMSMessageData struct {
			Message    string `json:"Message"`
			Recipients []struct {
				Cost       string `json:"cost"`
				Status     string `json:"status"`
				StatusCode int    `json:"statusCode"`
			} `json:"Recipients"`
		} `json:"SMSMessageData"`
	}

	json.NewDecoder(resp.Body).Decode(&result)

	if len(result.SMSMessageData.Recipients) > 0 {
		r := result.SMSMessageData.Recipients[0]
		success := r.StatusCode == 101 || r.Status == "Success"
		return SMSResult{
			Success: success,
			Status:  r.Status,
			Cost:    r.Cost,
		}
	}

	return SMSResult{Success: false, Error: "No recipient response"}
}

// SendBulkSMS - Send SMS to multiple recipients with worker pool
func SendBulkSMS(messages []SMSMessage) []SMSResult {
	results := make([]SMSResult, len(messages))

	// Use worker pool for bulk sending (max 5 concurrent)
	workers := 5
	jobs := make(chan int, len(messages))
	done := make(chan bool)

	for w := 0; w < workers; w++ {
		go func() {
			for i := range jobs {
				results[i] = SendSMS(messages[i].To, messages[i].Message)
				time.Sleep(100 * time.Millisecond) // Rate limit
			}
			done <- true
		}()
	}

	for i := range messages {
		jobs <- i
	}
	close(jobs)

	for w := 0; w < workers; w++ {
		<-done
	}

	return results
}

// formatKenyanPhone - Ensure phone is in +254XXXXXXXXX format
func formatKenyanPhone(phone string) string {
	phone = strings.TrimSpace(phone)
	phone = strings.ReplaceAll(phone, " ", "")
	phone = strings.ReplaceAll(phone, "-", "")

	if strings.HasPrefix(phone, "+") {
		return phone
	}
	if strings.HasPrefix(phone, "254") {
		return "+" + phone
	}
	if strings.HasPrefix(phone, "0") {
		return "+254" + phone[1:]
	}
	if strings.HasPrefix(phone, "7") || strings.HasPrefix(phone, "1") {
		return "+254" + phone
	}
	return ""
}

// --- SMS Templates ---

// SendPaymentConfirmation - Send payment receipt SMS
func SendPaymentConfirmation(phone, studentName string, amount float64, balance float64) SMSResult {
	message := fmt.Sprintf(
		"Payment of KES %.2f received for %s. New balance: KES %.2f. Thank you! - SchoolMS",
		amount, studentName, balance,
	)
	return SendSMS(phone, message)
}

// SendAttendanceAlert - Send absence notification to parent
func SendAttendanceAlert(phone, studentName, date string) SMSResult {
	message := fmt.Sprintf(
		"Alert: %s was marked ABSENT on %s. Please contact the school. - SchoolMS",
		studentName, date,
	)
	return SendSMS(phone, message)
}

// SendFeeReminder - Send fee balance reminder
func SendFeeReminder(phone, studentName string, balance float64) SMSResult {
	message := fmt.Sprintf(
		"Reminder: %s has an outstanding fee balance of KES %.2f. Please pay via M-PESA PayBill. - SchoolMS",
		studentName, balance,
	)
	return SendSMS(phone, message)
}

// SendBroadcast - Send school-wide announcement
func SendBroadcast(phone, schoolName, announcement string) SMSResult {
	message := fmt.Sprintf("%s: %s", schoolName, announcement)
	if len(message) > 160 {
		message = message[:157] + "..."
	}
	return SendSMS(phone, message)
}

// LogSMS - Log SMS to database
type SMSLog struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	SchoolID  uint      `gorm:"index" json:"school_id"`
	To        string    `json:"to"`
	Message   string    `json:"message"`
	Status    string    `json:"status"`
	Cost      string    `json:"cost"`
	Error     string    `json:"error"`
	CreatedAt time.Time `json:"created_at"`
}

func LogSMSSent(schoolID uint, to, message string, result SMSResult) {
	log := SMSLog{
		SchoolID:  schoolID,
		To:        to,
		Message:   message,
		Status:    result.Status,
		Cost:      result.Cost,
		Error:     result.Error,
		CreatedAt: time.Now(),
	}
	models.DB.Create(&log)
}
