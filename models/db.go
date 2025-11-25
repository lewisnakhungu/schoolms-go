// database.go

package models

import (
        "gorm.io/driver/sqlite" //sqlite driver
        "gorm.io/gorm" // go orm
        )

//declare a global variable to use go db anywhere in the app

var DB *gorm.DB

//db function

func ConnectDB() {
        //creates db or sqlite file or .db file
        db, err :=gorm.Open(sqlite.Open("schoolms.db"), &gorm.Config{})
        if err != nil{
            panic("Failed to connect to database!") //stop if db fails
        }

        //autogenerate tables
        db.AutoMigrate(&User{})

        //save the connection
        DB = db
        }


