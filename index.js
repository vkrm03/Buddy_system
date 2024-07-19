const express = require("express");
const bodyParser = require("body-parser");
const pg = require("pg");
const bcrypt = require('bcrypt');
const fs = require('fs');


const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "Mentor-mentee",
  password: "vkrm123",
  port: 5432
});
db.connect();

const app = express();
const port = 3000;

let currnt_Id, currnt_image_url ,currnt_role,currentStudentId, Admin;
let currentStudentImageUrl;

const students = [
    {
        id: 1,
        name: "arun",
        email: "arun@example.com",
        password: "password1",
        gender: "Male",
        mobile_no: "1234567890",
        image_url: "/student.jpg"
    },
    {
        id: 2,
        name: "safiya",
        email: "safiya@example.com",
        password: "password2",
        gender: "Female",
        mobile_no: "0987654321",
        image_url: "/student.jpg"
    }
];


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

function checkAuth(req, res, next) {
    if (currnt_Id) {
        next();
    } else if (currentStudentId) {
        next();
    } else if (Admin) {
        next();
    }else {
        res.redirect("/login?error=Please log in first");
    }
}


app.get("/", async (req, res) => {
    res.render("home.ejs");
});

app.get("/about", async (req, res) => {
    res.render("about.ejs");
});

app.get("/mentees", async (req, res) => {
    const directoryPath = './public/mentees';
    fs.readdir(directoryPath, (err, files) => {
        if (err) {
          console.error('Error reading directory:', err);
          return;
        }
      
        res.render("student-mentees-15.ejs", {datas:files});
      });
    
});

app.get("/login", async (req, res) => {
    const error = req.query.error;
    const success = req.query.success;
    const logout = req.query.logout;
    res.render("login.ejs", { error, success, logout });
});

app.get("/logout", (req, res) => {
    currnt_Id = null;
    currnt_image_url = null;
    currnt_role = null;
    res.redirect("/login?logout=true");
});


app.post("/login", async (req, res) => {
    const role = req.body.role
    const email = req.body.email
    const pass = req.body.pass
    const usr_type = req.body.roles
    currnt_role = usr_type;
    console.log(currnt_role);
    try {
        if (currnt_role === "adm") {
            if (email === "Admin@admin.com" && pass === "Password") {
                Admin = true;
                res.redirect("/admin-dashboard" + "?success=true");
            } else {
                res.redirect("/login?error=Invalid password");
            }
        } else if (currnt_role === "stf") {
            try {
                const result = await db.query('SELECT * FROM staff_information WHERE email = $1', [email]);
                if (result.rows.length > 0) {
                    const user = result.rows[0];
                    currnt_Id = user.id
                    if (currnt_Id == 1) {
                        currnt_image_url = "/A1_staff.jpg"
                    } else if (currnt_Id == 2) {
                        currnt_image_url = "/A2_staff.jpg"
                    }
                    else if (currnt_Id == 3) {
                        currnt_image_url = "/A3_staff.jpg"
                    }
                    else if (currnt_Id == 4) {
                        currnt_image_url = "/A4_staff.jpg"
                    }else  {
                        currnt_image_url = "/A5_staff.jpg"
                    }
                    if (user.passwords == pass) {
                        res.redirect("/dashboard?userId=" + currnt_Id + "&success=true");
                    } else {
                        res.redirect("/login?error=Invalid password");
                    }
                } else {
                    res.redirect("/login?error=User Not Found");
                }
            } catch (err) {
                console.error(err);
                res.redirect("/login?error=An error occurred");
            }
        } else if (currnt_role === "std") {
            currentStudentId = 1;
            res.redirect("/student-dashboard?userId=" + currentStudentId + "&success=true");
        }
    
} catch (err) {
    console.log(err);
}
});


app.get("/dashboard",checkAuth, async (req, res) => {
    const result = await db.query('SELECT * FROM staff_information WHERE id = $1', [currnt_Id]);
    if (result.rows.length > 0) {
        const user = result.rows[0];
        const success = req.query.success;
        res.render("index.ejs", {
            StaffName: user.name,   
            StaffEmail: user.email,
            StaffGender: user.gender,
            StaffMobileNum: user.mobile_no,
            StaffHandling: user.handlings,
            StaffHandlingSeniorName: user.handling_senior_names,
            image_url: currnt_image_url,
            success : success
        });
    } else {
        res.redirect("/login?error=User not found");
    }
});




app.get("/student-dashboard",checkAuth, async (req, res) => {
    const student = students.find(stu => stu.id === 1);
    const success = req.query.success;
    res.render("student_dashboard.ejs", {
        StudentName: student.name,
        StudentEmail: student.email,
        StudentGender: student.gender,
        StudentMobileNum: student.mobile_no,
        success: success
    });
});

app.get("/admin-dashboard", async (req, res) => {
    const success = req.query.success;
    res.render("admin-dashboard.ejs", {success: success})
});


app.get("/odop-std",checkAuth, async (req, res) => {
    res.render("odop-std.ejs");
});

app.get("/edit-admin",checkAuth, async (req, res) => {
    res.render("edit-admin.ejs");
});

app.get("/edit-staff",checkAuth, async (req, res) => {
    res.render("edit-staff.ejs");
});

app.get("/edit-student-datas",checkAuth, async (req, res) => {
    res.render("edit-student.ejs");
});

app.get("/my-stats",checkAuth, async (req, res) => {
    res.render("my-stats.ejs");
});


app.get("/odop-question",checkAuth, async (req, res) => {
    res.render("odop-question.ejs");
});

app.get("/odop-mentee-question",checkAuth, async (req, res) => {
    const staff = await db.query('SELECT * FROM staff_information WHERE id = $1', [currnt_Id]);
    staff_name = staff.rows[0].name
    res.render("odop-mentee-question.ejs", {StaffName:staff_name,image_url: currnt_image_url});
});


app.get("/edit-student",checkAuth, async (req, res) => {
    const staff = await db.query('SELECT * FROM staff_information WHERE id = $1', [currnt_Id]);
    staff_name = staff.rows[0].name
    const result = await db.query('SELECT * FROM mentor_student_information WHERE staff_id = $1', [currnt_Id]);
    student1 = result.rows[0]
    student2 = result.rows[1]
    student3 = result.rows[2]
    res.render("edit-student-data.ejs", {StaffName:staff_name,student_1:student1,student_2:student2,student_3:student3,image_url: currnt_image_url});
});
app.get("/edit-student/Edit",checkAuth, async (req, res) => {
    const staff = await db.query('SELECT * FROM staff_information WHERE id = $1', [currnt_Id]);
    staff_name = staff.rows[0].name
    res.render("edit-particular-student.ejs", {StaffName:staff_name,image_url: currnt_image_url});
});

app.get("/student-stats",checkAuth, async (req, res) => {
    const staff = await db.query('SELECT * FROM staff_information WHERE id = $1', [currnt_Id]);
    const std_data = await db.query('SELECT * FROM student_marks WHERE staff_id = $1 ORDER BY reg_no', [currnt_Id]);
    const std_datas = std_data.rows
    staff_name = staff.rows[0].name
    res.render("student_stats.ejs", {StaffName:staff_name,image_url: currnt_image_url,student_data:std_datas});
});

app.get("/student-stats/info",checkAuth, async (req, res) => {
    const staff = await db.query('SELECT * FROM staff_information WHERE id = $1', [currnt_Id]);
    staff_name = staff.rows[0].name
    particular_std_id = req.query.std_id
    const particular_info = await db.query('SELECT * FROM student_marks WHERE reg_no = $1', [particular_std_id]);
    res.render("particular_under_student_info.ejs", {StaffName:staff_name,image_url: currnt_image_url,full_data:particular_info.rows[0]});
});

app.get("/student-data/info",checkAuth, async (req, res) => {
    const staff = await db.query('SELECT * FROM staff_information WHERE id = $1', [currnt_Id]);
    staff_name = staff.rows[0].name
    std_id = req.query.std_id
    const twenty_std = await db.query('SELECT * FROM student_marks WHERE mentee_id = $1 ORDER BY reg_no', [std_id]);
    res.render("under_student_info.ejs", {StaffName:staff_name,image_url: currnt_image_url,under_twenty_std:twenty_std.rows});
});



app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
  